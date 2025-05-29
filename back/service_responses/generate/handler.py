import logging
import boto3
import json
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

from utils.response import Response
from utils.token import get_token_instance
from utils.config import RESPONSE_TABLE, DATA_QUESTION_REQUIRED
from utils.external_api import create_external_api_client_question
from utils.validator import create_validator_response_student_schema
from utils.prompt import prompt_verify_response
from utils.helper_functions import extract_delimited_text
from utils.ia_client import create_anthropic_haiku_client_instance
from datetime import datetime

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

token_validator = get_token_instance()
dynamodb = boto3.resource('dynamodb')
response_table = dynamodb.Table(RESPONSE_TABLE)

_service_question = create_external_api_client_question()
_validator_response = create_validator_response_student_schema()
_ia = create_anthropic_haiku_client_instance()
def lambda_handler(event, context):
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de procesamiento de solicitud")

    try:
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
        if not _validator_response.validate(data=body, path='body'):
            errors = _validator_response.get_errors()
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

        # --- AUTORIZACIÓN ---
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

        if role != "STUDENT":
            logger.warning(f"Rol no autorizado: {role}")
            return Response(
                status_code=403,
                body={
                    "success": False,
                    "code": "ROLE_NOT_PERMITTED",
                    "message": "No tienes permiso para realizar esta operación.",
                    "details": [f"El rol '{role}' no está permitido."],
                    "request_id": request_id
                }
            ).to_dict()
        # --- CHECK QUESTION ---
        room_id = body['room_id']
        question_id = body['question_id']
        try:
            question_resp = _service_question.request(
                endpoint=f'/questions/{question_id}/room/{room_id}',
                method="GET"
            )
        except Exception as err:
            logger.error(f"Error al consultar question {room_id}: {err}")
            return Response(
                status_code=502,
                body={
                    "success": False,
                    "code": "QUESTION_SERVICE_ERROR",
                    "message": "Error al comunicarse con el servicio de questions.",
                    "details": [str(err)],
                    "request_id": request_id
                }
            ).to_dict()

        question_data = question_resp.get("data")
        if not question_data:
            logger.error(f"question {question_id} y room {room_id} no encontrado o sin datos")
            return Response(
                status_code=404,
                body={
                    "success": False,
                    "code": "QUESTION_NOT_FOUND",
                    "message": "El room especificado no existe.",
                    "details": [f"room_id '{room_id}' y question_id {question_id} no encontrado."],
                    "request_id": request_id
                }
            ).to_dict()




        # --- GENERAR RESPUESTA IA ---
        try:
            data_question_required = {k: question_data.get(k) for k in DATA_QUESTION_REQUIRED}
            response_student = body["response_student"]
            #mas validaciones luego

            logger.info("generamos el prompt para correccion.")
            prompt_final = prompt_verify_response(question=data_question_required, response=response_student)
            logger.info("llamando a ia")
            text_ia = _ia.prompt(prompt=prompt_final)
            logger.info("extranedo respuesta ia")
            json_text = extract_delimited_text(text=text_ia, char_start="{", char_end="}")
            logger.info("json en texto generado")
            logger.info("extarendo dict")
            dict_ia = json.loads(json_text)
            logger.info("dict extraido")

        except Exception as e:
            logger.exception(f"Error al generar feedback con ia: {e}")
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


        # --- CREACIÓN DE LA RESPONSE ---
        now = datetime.utcnow().isoformat()
        response_data = {
            "room_id#student_id": f"{room_id}#{user_id}",
            "question_id": question_id,
            "question_data": question_data,
            'response_student': response_student,
            "response_ia": dict_ia,
            "created_at": now,
            "updated_at": now
        }

        # Inserción usando recurso de alto nivel
        try:
            response_table.put_item(
                Item=response_data
            )
            logger.info(
                f"response creado exitosamente en DynamoDB: room_id={room_id}, student_id={user_id}")
            return Response(
                status_code=201,
                body={
                    "success": True,
                    "code": "RESPONSE_GENERATE",
                    "message": "Respuesta corregida correctament.",
                    "data": dict_ia,
                    "request_id": request_id
                }
            ).to_dict()

        except Exception as e:
            logger.exception(f"Error inesperado al guardar respuesta en bd: {e}")
            return Response(
                status_code=500,
                body={
                    "success": False,
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Se produjo un error interno.",
                    "details": ["Error inesperado, por favor reporte el incidente."],
                    "request_id": request_id
                }
            ).to_dict()


    except Exception as e:
        logger.exception(f"Error inesperado en el servidor: {e}")
        return Response(
            status_code=500,
            body={
                "success": False,
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Se produjo un error interno.",
                "details": ["Error inesperado, por favor reporte el incidente."],
                "request_id": request_id
            }
        ).to_dict()


