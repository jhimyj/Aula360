import logging
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

from utils.response import Response
from utils.token import get_token_instance
from utils.config import STUDENT_TABLE
from utils.external_api import create_external_api_client_room
from utils.dynamo_utils import to_json_serializable

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

token_validator = get_token_instance()
dynamodb = boto3.resource('dynamodb')
students_table = dynamodb.Table(STUDENT_TABLE)

_service_room = create_external_api_client_room()

def lambda_handler(event, context):
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de procesamiento de solicitud")

    try:
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

        # --- CONSULTA EN DYNAMODB ---
        try:
            response_bd = students_table.query(
                KeyConditionExpression=Key('id').eq(user_id)
            )
            items = response_bd.get('Items', [])
            if not items:
                logger.warning(f"Estudiante con id '{user_id}' no encontrado")
                return Response(
                    status_code=404,
                    body={
                        "success": False,
                        "code": "STUDENT_NOT_FOUND",
                        "message": "No se encontró un estudiante con el ID proporcionado.",
                        "details": [f"ID: {user_id}"],
                        "request_id": request_id
                    }
                ).to_dict()
            if len(items) > 1:
                logger.error(f"Se encontraron múltiples estudiantes con el mismo ID: {user_id}")
                return Response(
                    status_code=500,
                    body={
                        "success": False,
                        "code": "DUPLICATE_STUDENTS",
                        "message": "Existe más de un estudiante con el mismo ID.",
                        "details": [f"ID: {user_id}"],
                        "request_id": request_id
                    }
                ).to_dict()

            item = items[0]
            response_data = to_json_serializable(item)

            return Response(
                status_code=200,
                body={
                    "success": True,
                    "code": "STUDENT_RETRIEVED",
                    "message": "Estudiante obtenido exitosamente.",
                    "data": response_data,
                    "request_id": request_id
                }
            ).to_dict()

        except ClientError as e:
            logger.error(f"Error al consultar DynamoDB: {e}")
            return Response(
                status_code=500,
                body={
                    "success": False,
                    "code": "DYNAMO_QUERY_ERROR",
                    "message": "No se pudo consultar la base de datos.",
                    "details": [str(e)],
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


