import json
import logging
import os
import boto3
import bcrypt
import uuid
from datetime import datetime

from utils.response import Response
from utils.validator import CustomValidator
from utils.models_validations import schema_register_user

logger = logging.getLogger()
logger.setLevel(logging.INFO)

USER_TABLE = os.environ['USER_TABLE']
GSI_INDEX_NAME = os.environ['USER_GSI_INDEX_USERNAME']

dyname = boto3.client('dynamodb')

validator_register_user = CustomValidator(schema_register_user)

def lambda_handler(event, context):
    try:
        body = event.get('body')

        if isinstance(body, str):
            body = json.loads(body)

        if not validator_register_user.validate(body):
            logger.error(f"Errores de validación: {validator_register_user.get_errors()}")
            return Response(status_code=400, body={'error': 'Fallo en la validación de datos',
                                                   'details': validator_register_user.get_errors()}).to_dict()

        username = body['username']

        response = dyname.query(
            TableName=USER_TABLE,
            IndexName=GSI_INDEX_NAME,
            KeyConditionExpression='username = :username',
            ExpressionAttributeValues={
                ':username': {'S': username}
            }
        )

        if 'Items' in response and len(response['Items']) > 0:
            logger.error(f"El nombre de usuario {username} ya existe.")
            return Response(status_code=400, body={'error': f'El username {username} ya existe'}).to_dict()

        user_data = {
            'id': {'S': str(uuid.uuid4())},
            'name': {'S': body['name']},
            'username': {'S': username},
            'password': {'S': body['password']},
            'last_name': {'S': body['last_name']},
            'created_at': {'S': datetime.utcnow().isoformat()}
        }

        password = user_data['password']['S'].encode('utf-8')
        hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())
        user_data['password']['S'] = hashed_password.decode('utf-8')


        try:
            dyname.put_item(
                TableName=USER_TABLE,
                Item=user_data,
                ConditionExpression="attribute_not_exists(username)"
            )

            logger.info(f"Usuario registrado exitosamente: {body['username']} en la tabla {USER_TABLE}")

            return Response(status_code=200, body={'message': 'Usuario registrado exitosamente'}).to_dict()

        except dyname.exceptions.ConditionalCheckFailedException:
            logger.error(f"El nombre de usuario {username} ya existe.")
            return Response(status_code=400, body={'error': f'El username {username} ya existe'}).to_dict()

    except Exception as e:
        logger.error(f"Error del servidor: {e}")
        return Response(status_code=500, body={'error': 'Error interno del servidor'}).to_dict()

# Solo test
if __name__ == '__main__':
    event = {
        "body": json.dumps({
            "name": "rj",
            "username": "12133",
            "password": "1saghj",
            "last_name": "nnxnnxnx"
        })
    }

    print(lambda_handler(event, None))