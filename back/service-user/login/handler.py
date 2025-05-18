import json
import logging
import boto3
import bcrypt

from utils.response import Response
from utils.dynamo_utils import serialize_dynamo_to_dict
from utils.config import USER_TABLE, USER_GSI_INDEX_USERNAME
from utils.validator import create_instance_validator_login
from utils.token import get_token_instance

logger = logging.getLogger()
logger.setLevel(logging.INFO)

validator_login_user = create_instance_validator_login()
token_validator = get_token_instance()

dyname = boto3.client('dynamodb')


def lambda_handler(event, context):
    """
    Función Lambda que maneja el proceso de inicio de sesión del usuario. Valida las credenciales proporcionadas
        (nombre de usuario y contraseña), verifica las credenciales contra los datos almacenados en DynamoDB,
        y genera un token JWT si el inicio de sesión es exitoso.
    """
    try:
        body = event.get('body')

        if isinstance(body, str):
            body = json.loads(body)

        if not body:
            return Response(status_code=400, body={'error': 'El body debe tener los parametros requeridos.'}).to_dict()


        if not validator_login_user.validate(data=body,param_field='body'):
            logger.error(f"Errores de validación: {validator_login_user.get_errors()}")
            return Response(status_code=400, body={'error': 'Fallo en la validación de datos',
                                                   'details': validator_login_user.get_errors()}).to_dict()

        username = body['username']
        password = body['password']

        response = dyname.query(
            TableName=USER_TABLE,
            IndexName=USER_GSI_INDEX_USERNAME,
            KeyConditionExpression='username = :username',
            ExpressionAttributeValues={
                ':username': {'S': username}
            }
        )

        if 'Items' not in response or len(response['Items']) == 0:
            logger.error(f"Usuario no encontrado: {username}")
            return Response(status_code=401, body={'error': 'Usuario no encontrado'}).to_dict()
        response_item_serialiser = serialize_dynamo_to_dict(response['Items'][0])

        stored_hashed_password = response_item_serialiser['password']
        id = response_item_serialiser['id']
        role = response_item_serialiser['role']

        if not bcrypt.checkpw(password.encode('utf-8'), stored_hashed_password.encode('utf-8')):
            logger.error(f"Contraseña incorrecta para el usuario: {username}")
            return Response(status_code=401, body={'error': 'Contraseña incorrecta'}).to_dict()

        payload = {
            'id': id,
            'role': role,
            'username': username
        }

        token = token_validator.generate_token(payload)


        logger.info(f"Usuario autenticado exitosamente: {username}")

        return Response(status_code=200, body={'message': 'Login exitoso', 'token': token}).to_dict()

    except Exception as e:
        logger.error(f"Error del servidor: {e}")
        return Response(status_code=500, body={'message': 'Error interno del servidor'}).to_dict()


