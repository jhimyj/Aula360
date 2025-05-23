import logging
import boto3
from utils.response import Response
from utils.token import get_token_instance
from utils.config import ROOM_TABLE, ROLES_PERMITTED_GET_ROOM, ROLES_PERMITED_CREATE_ROOM
from utils.dynamo_utils import serialize_dynamo_to_dict

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


token_validator = get_token_instance()

dynamodb_client = boto3.client('dynamodb')

# Esta función maneja la solicitud de obtener los datos de una "room" desde DynamoDB
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

        response = dynamodb_client.query(
            TableName=ROOM_TABLE,
            KeyConditionExpression='id = :id',
            ExpressionAttributeValues={
                ':id': {'S': room_id}
            }
        )

        if 'Items' not in response or len(response['Items']) == 0:
            logger.error(f"Room no encontrado con ID: {room_id}")
            return Response(status_code=404, body={'error': 'Room no encontrado.'}).to_dict()

        room_data = response['Items'][0]
        room_data = serialize_dynamo_to_dict(room_data)
        if role not in ROLES_PERMITTED_GET_ROOM:
            logger.error(f"Acceso no autorizado para el usuario {user_id} a la room con ID: {room_id}")
            return Response(status_code=403, body={"error": "Acceso no autorizado al room."}).to_dict()

        if role in ROLES_PERMITED_CREATE_ROOM and room_data["user_id"] != user_id:
            logger.error(f"Acceso no autorizado para el usuario {user_id} a la room con ID: {room_id}")
            return Response(status_code=403, body={"error": "Acceso no autorizado al room."}).to_dict()

        return Response(status_code=200, body={'message': 'Datos obtenidos correctamente', 'data': room_data}).to_dict()

    except Exception as e:
        logger.error(f"Error inesperado en el servidor: {str(e)}")
        return Response(status_code=500, body={'message': 'Error interno del servidor.'}).to_dict()


