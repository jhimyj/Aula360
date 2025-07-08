import logging
import boto3
from utils.response import Response
from utils.token import get_token_instance
from utils.config import ROOM_TABLE, ROLES_PERMITTED_GET_ROOM, ROLES_PERMITED_CREATE_ROOM
from boto3.dynamodb.conditions import Attr

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


token_validator = get_token_instance()

dynamodb = boto3.resource('dynamodb')
room_table = dynamodb.Table(ROOM_TABLE)

def lambda_handler(event, context):
    try:
        headers = event.get('headers')
        if not headers or 'Authorization' not in headers:
            logger.error("Falta el encabezado de autorización en la solicitud.")
            return Response(status_code=400, body={"error": "Falta el encabezado de autorización."}).to_dict()

        auth_header = headers['Authorization']
        token = token_validator.remove_bearer_prefix(auth_header)

        try:
            jwt_decode = token_validator.decode_token(token)
        except ValueError as e:
            logger.error(f"Error al decodificar el token JWT: {str(e)}")
            return Response(status_code=401, body={"error": "Token JWT inválido."}).to_dict()

        user_id = jwt_decode.get('id')
        role = jwt_decode.get('role')

        if not user_id or not role:
            logger.error(f"Faltan los campos user_id o role: {user_id}, {role}")
            return Response(status_code=401, body={"error": "Faltan los campos de usuario (ID) o rol."}).to_dict()

        pathParameter = event.get("pathParameters")
        if not pathParameter or 'roomId' not in pathParameter:
            logger.error("Falta el parámetro roomId en la solicitud.")
            return Response(status_code=400, body={"error": "Falta el parámetro roomId en la solicitud."}).to_dict()

        room_id = pathParameter.get('roomId')

        if role not in ROLES_PERMITED_CREATE_ROOM:
            logger.error(f"Rol no permitido: {role}")
            return Response(status_code=401, body={"error": "Rol no permitido para eliminar un room."}).to_dict()

        try:
            room_table.delete_item(
                Key={
                    'id': room_id
                },
                ConditionExpression=Attr('user_id').eq(user_id)
            )
            logger.info("Room eliminado correctamente.")
        except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
            logger.error(f"no se pudo eliminar ron debido a que no le pertenecea user_id {user_id}")
            return Response(status_code=401, body={"error": "usario no permitido para eliminar un room."}).to_dict()

        return Response(
            status_code=204,
            body={}
        ).to_dict()

    except Exception as e:
        logger.error(f"Error inesperado en el servidor: {str(e)}")
        return Response(status_code=500, body={'message': 'Error interno del servidor.'}).to_dict()


