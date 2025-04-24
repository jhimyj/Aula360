import json
import logging
import os
import boto3
import bcrypt
import jwt
from datetime import datetime, timedelta

from utils.response import Response
from utils.validator import CustomValidator
from utils.models_validations import schema_login_user


logger = logging.getLogger()
logger.setLevel(logging.INFO)

validator_login_user = CustomValidator(schema_login_user)


USER_TABLE = os.environ['USER_TABLE']
GSI_INDEX_NAME = os.environ['USER_GSI_INDEX_USERNAME']


dyname = boto3.client('dynamodb')


SECRET_KEY = os.environ['SECRET_KEY']


TOKEN_EXPIRATION = 30


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

        if not validator_login_user.validate(body):
            logger.error(f"Errores de validación: {validator_login_user.get_errors()}")
            return Response(status_code=400, body={'error': 'Fallo en la validación de datos',
                                                   'details': validator_login_user.get_errors()}).to_dict()

        username = body['username']
        password = body['password']

        response = dyname.query(
            TableName=USER_TABLE,
            IndexName=GSI_INDEX_NAME,
            KeyConditionExpression='username = :username',
            ExpressionAttributeValues={
                ':username': {'S': username}
            }
        )

        if 'Items' not in response or len(response['Items']) == 0:
            logger.error(f"Usuario no encontrado: {username}")
            return Response(status_code=401, body={'error': 'Usuario no encontrado'}).to_dict()

        stored_hashed_password = response['Items'][0]['password']['S']

        if not bcrypt.checkpw(password.encode('utf-8'), stored_hashed_password.encode('utf-8')):
            logger.error(f"Contraseña incorrecta para el usuario: {username}")
            return Response(status_code=401, body={'error': 'Contraseña incorrecta'}).to_dict()

        payload = {
            'username': username,
            'exp': datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRATION)
        }

        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        logger.info(f"Usuario autenticado exitosamente: {username}")

        return Response(status_code=200, body={'message': 'Login exitoso', 'token': token}).to_dict()

    except Exception as e:
        logger.error(f"Error del servidor: {e}")
        return Response(status_code=500, body={'message': 'Error interno del servidor'}).to_dict()


if __name__ == '__main__':
    event = {
        'body': json.dumps({
            'username': 'peresfvbn',
            'password': '12345678',
        })
    }

    print(lambda_handler(event, None))