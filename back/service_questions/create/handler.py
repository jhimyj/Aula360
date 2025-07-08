import json
import logging
import uuid
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

from utils.validator import (
    create_validator_schema_question,
    create_validator_config_multiple_choice_single,
    create_validator_config_open_ended
)
from utils.response import Response
from utils.token import get_token_instance
from utils.config import (
    QUESTION_TABLE,
    ROLES_PERMITED_CREATE_QUESTION
)
from utils.external_api import create_external_api_client_room

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

token_validator = get_token_instance()

# DynamoDB Resource
dynamodb = boto3.resource('dynamodb')
questions_table = dynamodb.Table(QUESTION_TABLE)

# Configuración de validadores
_validator_question = create_validator_schema_question()
_validator_multiple_choice_single = create_validator_config_multiple_choice_single()
_validator_open_ended = create_validator_config_open_ended()
_dict_validator_types_question = {
    "MULTIPLE_CHOICE_SINGLE": _validator_multiple_choice_single,
    "MULTIPLE_CHOICE_MULTIPLE": _validator_multiple_choice_single,
    "OPEN_ENDED": _validator_open_ended
}

# Cliente externo de rooms
_service_room = create_external_api_client_room()


def lambda_handler(event, context):
    """
    Esta función crea una question en la base de datos DynamoDB usando el recurso de alto nivel.
    """
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de procesamiento de solicitud")

    try:
        # --- BODY & JSON PARSING ---
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
        if not _validator_question.validate(data=body, path='body'):
            errors = _validator_question.get_errors()
            logger.error(f"Falló validación de question: {errors}")
            user_errors = [f"Campo '{f}': {'; '.join(msgs)}" for f, msgs in errors.items()]
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

        validator_config = _dict_validator_types_question.get(body['type'])
        if not validator_config.validate(data=body['config'], path='config'):
            errors = validator_config.get_errors()
            logger.error(f"Falló validación de config ({body['type']}): {errors}")
            user_errors = [f"Campo '{f}': {'; '.join(msgs)}" for f, msgs in errors.items()]
            return Response(
                status_code=400,
                body={
                    "success": False,
                    "code": "VALIDATION_ERROR",
                    "message": "Datos de configuración inválidos.",
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

        # --- CREACIÓN DE LA QUESTION ---
        now = datetime.utcnow().isoformat()
        question_id = str(uuid.uuid4())
        question_data = {
            **body,
            "id": question_id,
            "created_at": now,
            "updated_at": now
        }

        # Inserción usando recurso de alto nivel
        try:
            questions_table.put_item(
                Item=question_data,
                ConditionExpression="attribute_not_exists(id)"
            )
            logger.info("Question creada exitosamente en DynamoDB")
            return Response(
                status_code=201,
                body={
                    "success": True,
                    "code": "QUESTION_CREATED",
                    "message": "Pregunta creada exitosamente.",
                    "data": {"id": question_id},
                    "request_id": request_id
                }
            ).to_dict()

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ConditionalCheckFailedException':
                logger.error(f"Duplicate id: {question_id}")
                return Response(
                    status_code=409,
                    body={
                        "success": False,
                        "code": "DUPLICATE_QUESTION",
                        "message": "El ID de la pregunta ya existe.",
                        "details": [f"id '{question_id}' duplicado."],
                        "request_id": request_id
                    }
                ).to_dict()
            else:
                logger.exception("Error al insertar en DynamoDB")
                return Response(
                    status_code=500,
                    body={
                        "success": False,
                        "code": "DYNAMODB_ERROR",
                        "message": "Error al escribir en la tabla de preguntas.",
                        "details": [error_code],
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
