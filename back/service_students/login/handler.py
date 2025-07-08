import json
import logging
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from requests.exceptions import HTTPError

from utils.validator import (
    create_validator_schema_login
)
from utils.response import Response
from utils.token import get_token_instance
from utils.config import (
    STUDENT_TABLE,
    STUDENT_GSI_INDEX_USERNAME_ROOMID,
    ROLE_STUDENT
)
from utils.external_api import create_external_api_client_room

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

token_validator = get_token_instance()

# DynamoDB Resource
dynamodb = boto3.resource('dynamodb')
students_table = dynamodb.Table(STUDENT_TABLE)

# Configuración de validadores
_validator_student = create_validator_schema_login()
# Cliente externo de rooms
_service_room = create_external_api_client_room()

def lambda_handler(event, context):
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de login del estudiante")

    try:
        # --- BODY & JSON PARSING ---
        body = event.get('body')
        if body is None:
            return Response(400, {
                "success": False,
                "code": "BODY_MISSING",
                "message": "El cuerpo de la solicitud es obligatorio.",
                "details": ["Incluye un JSON en el body de la petición."],
                "request_id": request_id
            }).to_dict()

        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                return Response(400, {
                    "success": False,
                    "code": "INVALID_JSON",
                    "message": "El cuerpo debe ser un JSON válido.",
                    "details": [],
                    "request_id": request_id
                }).to_dict()

        # --- VALIDACIONES ---
        if not _validator_student.validate(data=body, path='body'):
            errors = _validator_student.get_errors()
            logger.error(f"Falló validación de student: {errors}")
            user_errors = [f"Campo '{f}': {' '.join(msgs)}" for f, msgs in errors.items()]
            return Response(
                status_code=400,
                body={
                    "success": False,
                    "code": "VALIDATION_ERROR",
                    "message": "Datos de student inválidos.",
                    "details": user_errors,
                    "request_id": request_id
                }
            ).to_dict()

        username = body.get("username")
        room_id = body.get("room_id")


        # --- Consultar en DynamoDB ---
        try:
            response_bd = students_table.query(
                IndexName=STUDENT_GSI_INDEX_USERNAME_ROOMID,
                KeyConditionExpression=Key('username').eq(username) & Key('room_id').eq(room_id),
                Limit=1,
                ConsistentRead=False
            )
        except ClientError as e:
            logger.error(f"Error consultando DynamoDB: {e}")
            return Response(500, {
                "success": False,
                "code": "DYNAMODB_QUERY_ERROR",
                "message": "No se pudo consultar la base de datos.",
                "details": [str(e)],
                "request_id": request_id
            }).to_dict()

        items = response_bd.get("Items", [])
        if not items:
            return Response(404, {
                "success": False,
                "code": "STUDENT_NOT_FOUND",
                "message": "Estudiante no encontrado.",
                "details": ["Verifica que username y room_id sean correctos."],
                "request_id": request_id
            }).to_dict()

        student_data = items[0]
        student_id = student_data['id']

        # --- Validar existencia del room (igual que en tu código) ---
        payload = {
            'id': student_id,
            'role': ROLE_STUDENT,
            'username': username
        }
        token = token_validator.generate_token(payload)

        try:
            #aca solo se valida la existencia  no de hace nada con la data retornada
            _service_room.request(
                endpoint=f'/rooms/{room_id}',
                method="GET",
                headers={'Authorization': f'Bearer {token}'}
            )
        except HTTPError as e:
            logger.error(f"Error validando room: {e}")
            if e.response is not None and e.response.status_code == 404:
                return Response(404, {
                    "success": False,
                    "code": "ROOM_NOT_FOUND",
                    "message": "El room no existe.",
                    "details": ["Verifica el room_id ingresado."],
                    "request_id": request_id
                }).to_dict()
            return Response(502, {
                "success": False,
                "code": "ROOM_SERVICE_ERROR",
                "message": "Error al comunicarse con el servicio de rooms.",
                "details": [str(e)],
                "request_id": request_id
            }).to_dict()

        # --- Devolver token y data del estudiante ---
        return Response(200, {
            "success": True,
            "code": "LOGIN_SUCCESS",
            "message": "Login exitoso.",
            "data": {
                "token": token
            },
            "request_id": request_id
        }).to_dict()

    except Exception as e:
        logger.exception("Error inesperado en login")
        return Response(500, {
            "success": False,
            "code": "INTERNAL_ERROR",
            "message": "Error interno en el servidor.",
            "details": [str(e)],
            "request_id": request_id
        }).to_dict()
