import json
import logging
import uuid
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

from utils.validator import (
    create_validator_schema_question_list,
    create_validator_schema_question_item,
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
_validator_question_list = create_validator_schema_question_list()
_validator_question_item = create_validator_schema_question_item()
_validator_multiple_choice_single = create_validator_config_multiple_choice_single()
_validator_open_ended = create_validator_config_open_ended()
_dict_validator_item = {
    "MULTIPLE_CHOICE_SINGLE": _validator_multiple_choice_single,
    "MULTIPLE_CHOICE_MULTIPLE": _validator_multiple_choice_single,
    "OPEN_ENDED": _validator_open_ended
}

# Cliente externo de rooms
_service_room = create_external_api_client_room()


def lambda_handler(event, context):
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de procesamiento de múltiples preguntas")

    try:
        # 1) Parsear body
        body = event.get('body')
        if body is None:
            logger.error("Cuerpo de solicitud ausente")
            return Response(400, {
                "success": False, "code": "BODY_MISSING",
                "message": "El cuerpo de la solicitud es obligatorio.",
                "details": ["Incluye un JSON con 'room_id' y 'questions'."],
                "request_id": request_id
            }).to_dict()

        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError as err:
                logger.error(f"JSON inválido: {err}")
                return Response(400, {
                    "success": False, "code": "INVALID_JSON",
                    "message": "El cuerpo debe ser JSON válido.",
                    "details": ["Revisa la sintaxis JSON."],
                    "request_id": request_id
                }).to_dict()

        if not isinstance(body, dict) or not body:
            logger.error("Formato de body incorrecto")
            return Response(400, {
                "success": False, "code": "EMPTY_BODY",
                "message": "El cuerpo JSON no puede estar vacío.",
                "details": ["Envía un objeto con 'room_id' y 'questions'."],
                "request_id": request_id
            }).to_dict()

        # 2) Validar lista de preguntas completa
        if not _validator_question_list.validate(data=body, path='body'):
            errors = _validator_question_list.get_errors()
            logger.error(f"Validación de lista fallida: {errors}")
            user_errors = [f"campo '{f}': {' '.join(msgs)}" for f, msgs in errors.items()]
            return Response(400, {
                "success": False, "code": "VALIDATION_ERROR",
                "message": "Datos de entrada inválidos.",
                "details": user_errors,
                "request_id": request_id
            }).to_dict()

        room_id = body['room_id']
        questions_input = body['questions']

        # 3) Autorización única
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization')
        if not auth_header:
            logger.error("Autorización faltante")
            return Response(401, {
                "success": False, "code": "AUTH_HEADER_MISSING",
                "message": "Falta cabecera 'Authorization'.",
                "details": ["Incluye tu JWT en 'Authorization'."],
                "request_id": request_id
            }).to_dict()

        token = token_validator.remove_bearer_prefix(auth_header)
        try:
            payload = token_validator.decode_token(token)
        except ValueError as err:
            logger.error(f"Token inválido: {err}")
            return Response(401, {
                "success": False, "code": "INVALID_TOKEN",
                "message": "No se pudo decodificar el token.",
                "details": [str(err)],
                "request_id": request_id
            }).to_dict()

        user_id = payload.get('id')
        role = payload.get('role')
        if not user_id or not role or role not in ROLES_PERMITED_CREATE_QUESTION:
            logger.warning(f"Acceso denegado para rol {role}")
            return Response(403, {
                "success": False, "code": "ACCESS_DENIED",
                "message": "No tienes permiso para crear preguntas.",
                "details": [],
                "request_id": request_id
            }).to_dict()

        # 4) Verificar room_id una sola vez
        try:
            room_resp = _service_room.request(
                endpoint=f"/rooms/{room_id}",
                method="GET",
                headers={
                    'Authorization': auth_header
                }
            )
            room_data = room_resp.get('data', {})
        except Exception as err:
            logger.error(f"Error al verificar room: {err}")
            return Response(502, {
                "success": False, "code": "ROOM_SERVICE_ERROR",
                "message": "No se pudo validar el room.",
                "details": [str(err)],
                "request_id": request_id
            }).to_dict()

        if room_data.get('user_id') != user_id:
            logger.warning("Usuario no propietario del room")
            return Response(403, {
                "success": False, "code": "NOT_ROOM_OWNER",
                "message": "Solo el propietario puede agregar preguntas.",
                "details": [],
                "request_id": request_id
            }).to_dict()

        # 5) Validar cada pregunta sin insertar
        for i, q in enumerate(questions_input):
            path = f"questions[{i+1}]"
            if not _validator_question_item.validate(data=q, path=path):
                errs = _validator_question_item.get_errors()
                logger.error(f"Error validando {path}: {errs}")
                details = [f"{f}: {' '.join(msgs)}" for f, msgs in errs.items()]
                return Response(400, {
                    "success": False, "code": "VALIDATION_ERROR",
                    "message": f"Datos inválidos en {path}.",
                    "details": details,
                    "request_id": request_id
                }).to_dict()

            cfg_val = _dict_validator_item[q['type']]
            if not cfg_val.validate(data=q['config'], path=f"{path}.config"):
                errs = cfg_val.get_errors()
                logger.error(f"Error validando config en {path}: {errs}")
                details = [f"{f}: {' '.join(msgs)}" for f, msgs in errs.items()]
                return Response(400, {
                    "success": False, "code": "VALIDATION_ERROR",
                    "message": f"Configuración inválida en {path}.",
                    "details": details,
                    "request_id": request_id
                }).to_dict()

        # 6) Inserción en lote tras validación exitosa
        created = []

        try:
            with questions_table.batch_writer() as batch:
                for q in questions_input:
                    qid = str(uuid.uuid4())
                    now = datetime.utcnow().isoformat()
                    item = {
                        **q,
                        "id": qid,
                        "room_id": room_id,
                        "created_at": now,
                        "updated_at": now
                    }
                    batch.put_item(Item=item)
                    created.append(qid)
        except ClientError as err:
            logger.exception("Batch fallido")
            return Response(500, {
                "success": False, "code": "DYNAMODB_ERROR",
                "message": "Error al crear preguntas.",
                "details": [err.response['Error']['Message']],
                "request_id": request_id
            }).to_dict()

        # 7) Respuesta exitosa
        return Response(201, {
            "success": True,
            "code": "QUESTIONS_CREATED",
            "message": "Preguntas creadas exitosamente.",
            "data": {"question_ids": created},
            "request_id": request_id
        }).to_dict()

    except Exception as err:
        logger.exception("Error inesperado al procesar el lote de preguntas")
        return Response(500, {
            "success": False,
            "code": "INTERNAL_SERVER_ERROR",
            "message": "Ocurrió un error inesperado.",
            "details": [str(err)],
            "request_id": request_id
        }).to_dict()
