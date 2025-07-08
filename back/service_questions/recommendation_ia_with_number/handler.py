import json
import logging
import uuid
import boto3
import random
from datetime import datetime
from botocore.exceptions import ClientError

from utils.validator import (
    create_validator_recommendation_ia_with_number_question_schema
)
from utils.response import Response
from utils.token import get_token_instance
from utils.config import (
    QUESTION_TABLE,
    ROLES_PERMITED_CREATE_QUESTION
)
from utils.external_api import create_external_api_client_room

from utils.ia_client import create_dict_anthropic_haiku_client_instances
from utils.prompt import prompt_recommendation_with_number
from utils.helper_functions import extract_delimited_text

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

token_validator = get_token_instance()

dynamodb = boto3.resource('dynamodb')
questions_table = dynamodb.Table(QUESTION_TABLE)

_validator_promt_user = create_validator_recommendation_ia_with_number_question_schema()

_service_room = create_external_api_client_room()
_ias = create_dict_anthropic_haiku_client_instances()
MAX_INDEX_IA = len(_ias)-1

def lambda_handler(event, context):
    """
    Esta función crea una question en la base de datos DynamoDB usando el recurso de alto nivel.
    """
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de procesamiento de solicitud")

    try:
        # --- BODY AND JSON PARSING ---
        body = event.get('body')
        if body is None:
            logger.error("Parámetro 'body' ausente en el evento")
            return Response(
                status_code=400,
                body={
                    "success": False,
                    "code": "BODY_MISSING",
                    "message": "El cuerpo de la solicitud es obligatorio.",
                    "details": ["Incluye un JSON en el body de la petición."],
                    "request_id": request_id
                }
            ).to_dict()

        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError as err:
                logger.error(f"JSON inválido: {err}")
                return Response(
                    status_code=400,
                    body={
                        "success": False,
                        "code": "INVALID_JSON",
                        "message": "El cuerpo de la solicitud debe ser JSON válido.",
                        "details": ["Revisa la sintaxis JSON en el cuerpo de la petición."],
                        "request_id": request_id
                    }
                ).to_dict()

        if not isinstance(body, dict) or not body:
            logger.error("Cuerpo JSON vacío o formato incorrecto")
            return Response(
                status_code=400,
                body={
                    "success": False,
                    "code": "EMPTY_BODY",
                    "message": "El cuerpo JSON no puede estar vacío.",
                    "details": ["Proporciona al menos una propiedad en el JSON."],
                    "request_id": request_id
                }
            ).to_dict()

        # --- VALIDACIONES ---
        if not _validator_promt_user.validate(data=body, path='body'):
            errors = _validator_promt_user.get_errors()
            logger.error(f"Falló validación de question: {errors}")
            user_errors = [f"Campo '{f}': {' '.join(msgs)}" for f, msgs in errors.items()]
            return Response(
                status_code=400,
                body={
                    "success": False,
                    "code": "VALIDATION_ERROR",
                    "message": "Datos de question inválidos.",
                    "details": user_errors,
                    "request_id": request_id
                }
            ).to_dict()



        # --- AUTORIZACION ---
        headers = event.get('headers') or {}
        auth_header = headers.get('Authorization')
        if not auth_header:
            logger.error("Cabecera Authorization ausente")
            return Response(
                status_code=401,
                body={
                    "success": False,
                    "code": "AUTH_HEADER_MISSING",
                    "message": "Falta la cabecera de autorización.",
                    "details": ["Incluye el token JWT en 'Authorization'."],
                    "request_id": request_id
                }
            ).to_dict()

        token = token_validator.remove_bearer_prefix(auth_header)
        try:
            jwt_payload = token_validator.decode_token(token)
        except ValueError as err:
            logger.error(f"Token JWT inválido: {err}")
            return Response(
                status_code=401,
                body={
                    "success": False,
                    "code": "INVALID_TOKEN",
                    "message": "No se pudo decodificar el token JWT.",
                    "details": [str(err)],
                    "request_id": request_id
                }
            ).to_dict()

        user_id = jwt_payload.get('id')
        role = jwt_payload.get('role')
        if not user_id or not role:
            logger.error(f"JWT sin 'id' o 'role' ({user_id}, {role})")
            return Response(
                status_code=401,
                body={
                    "success": False,
                    "code": "MISSING_CLAIMS",
                    "message": "El token JWT no contiene los campos obligatorios.",
                    "details": ["Asegúrate de incluir 'id' y 'role' en el JWT."],
                    "request_id": request_id
                }
            ).to_dict()

        if role not in ROLES_PERMITED_CREATE_QUESTION:
            logger.warning(f"Rol no autorizado: {role}")
            return Response(
                status_code=403,
                body={
                    "success": False,
                    "code": "ROLE_NOT_PERMITTED",
                    "message": "No tienes permiso para crear preguntas.",
                    "details": [f"El rol '{role}' no está permitido."],
                    "request_id": request_id
                }
            ).to_dict()

        # --- ROOM CHECK ---
        room_id = body['room_id']
        try:
            room_resp = _service_room.request(
                endpoint=f'/rooms/{room_id}',
                method="GET",
                headers={
                    'Authorization': auth_header
                }
            )
        except Exception as err:
            logger.error(f"Error al consultar room {room_id}: {err}")
            return Response(
                status_code=502,
                body={
                    "success": False,
                    "code": "ROOM_SERVICE_ERROR",
                    "message": "Error al comunicarse con el servicio de rooms.",
                    "details": [str(err)],
                    "request_id": request_id
                }
            ).to_dict()

        room_data = room_resp.get("data")
        if not room_data:
            logger.error(f"Room {room_id} no encontrado o sin datos")
            return Response(
                status_code=404,
                body={
                    "success": False,
                    "code": "ROOM_NOT_FOUND",
                    "message": "El room especificado no existe.",
                    "details": [f"room_id '{room_id}' no encontrado."],
                    "request_id": request_id
                }
            ).to_dict()

        if room_data.get("user_id") != user_id:
            logger.warning(f"Usuario {user_id} no es propietario del room {room_id}")
            return Response(
                status_code=403,
                body={
                    "success": False,
                    "code": "NOT_ROOM_OWNER",
                    "message": "No tienes permiso sobre este room.",
                    "details": ["Solo el creador del room puede añadir preguntas."],
                    "request_id": request_id
                }
            ).to_dict()

        #--- GENERAR RESPUESTA IA ---
        try:
            course = room_data.get("course", "")
            topic = room_data.get("topic","")
            user_prompt = body['user_prompt']
            number_questions = body['number_questions']
            logger.info("generando promt con el de user")
            prompt_final = prompt_recommendation_with_number(course,topic,user_prompt,number_questions)

            #indice aleatorio
            idx = random.randint(0, MAX_INDEX_IA)
            logger.info("llamando a ia")

            text_ia = _ias[idx].prompt(prompt=prompt_final)
            logger.info("extranedo preguntas")
            json_text = extract_delimited_text(text=text_ia,char_start="[",char_end="]")
            logger.info("json en texto generado")
            logger.info("extarendo dict")
            list_questions = json.loads(json_text)
            logger.info("dict extraido")
            return Response(
                status_code=200,
                body={
                    "success": True,
                    "code": "RECOMMENDATION_GENERATE",
                    "message": "Recomendación generada exitosamente.",
                    "data": list_questions,
                    "request_id": request_id
                }
            ).to_dict()
        except Exception as e:
            logger.exception(f"Error al generar preguntas con ia: {e}")
            return Response(
                status_code=500,
                body={
                    "success": False,
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Se produjo un error interno.",
                    "details": ["por favor intentelo mas tarde."],
                    "request_id": request_id
                }
            ).to_dict()

    except Exception as e:
        logger.exception(f"Error inesperado en servidor: {e}")
        return Response(
            status_code=500,
            body={
                "success": False,
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Se produjo un error interno.",
                "details": ["Consulta los logs para más información."],
                "request_id": request_id
            }
        ).to_dict()

