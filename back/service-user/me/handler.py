import logging
import boto3

from utils.response import Response
from utils.dynamo_utils import serialize_dynamo_to_dict
from utils.config import USER_TABLE
from utils.token import get_token_instance

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dyname = boto3.client('dynamodb')

token_valitador = get_token_instance()


def lambda_handler(event, context):
    """
    Esta función obtiene los datos del usuario dado un JWT token. El token es decodificado y el ID del usuario
    se extrae para hacer una consulta a DynamoDB y obtener los datos asociados con ese usuario.
    """
    try:
        headers = event.get('headers')
        if not headers or 'Authorization' not in headers:
            return Response(status_code=400, body={"error": "Missing Authorization header"})

        auth_header = headers['Authorization']

        token = token_valitador.remove_bearer_prefix(auth_header)
        try:
            jwt_decode = token_valitador.decode_token(token)
        except ValueError as e:
            logger.error(f"error decoding JWT token: {str(e)}")
            return Response(status_code=401, body={"error": str(e)}).to_dict()

        user_id = jwt_decode.get('id')

        if not user_id:
            return Response(status_code=400, body={"error": "Missing user ID in token"})

        response = dyname.query(
            TableName=USER_TABLE,
            KeyConditionExpression='id = :id',
            ExpressionAttributeValues={
                ':id': {'S': user_id}
            }
        )

        if 'Items' not in response or len(response['Items']) == 0:
            logger.error(f"Usuario no encontrado: {user_id}")
            return Response(status_code=401, body={'error': 'Usuario no encontrado'}).to_dict()

        user_data = response['Items'][0]

        user_data = serialize_dynamo_to_dict(user_data)
        if "password" in user_data:
            del user_data["password"]

        return Response(status_code=200, body={'message': 'Datos obtenidos correctamente', 'data': user_data}).to_dict()

    except Exception as e:
        logger.error(f"Error del servidor: {e}")
        return Response(status_code=500, body={'message': 'Error interno del servidor'}).to_dict()

