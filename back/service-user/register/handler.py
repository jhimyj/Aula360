import json
import logging
import boto3
import bcrypt
import uuid
from datetime import datetime

from utils.response import Response
from utils.dynamo_utils import serialize_to_dynamo
from utils.config import USER_TABLE, USER_GSI_INDEX_USERNAME
from utils.validator import create_instance_validator_register

logger = logging.getLogger()
logger.setLevel(logging.INFO)


dyname = boto3.client('dynamodb')

validator_register = create_instance_validator_register()

def lambda_handler(event, context):
    try:
        body = event.get('body')


        if isinstance(body, str):
            body = json.loads(body)

        if not body:
            return Response(status_code=400, body={'error': 'El body debe tener los parametros requeridos.'}).to_dict()

        if not validator_register.validate(data=body,param_field='body'):
            logger.error(f"Errores de validación: {validator_register.get_errors()}")
            return Response(status_code=400, body={'error': 'Fallo en la validación de datos',
                                                   'details': validator_register.get_errors()}).to_dict()

        username = body['username']

        response = dyname.query(
            TableName=USER_TABLE,
            IndexName=USER_GSI_INDEX_USERNAME,
            KeyConditionExpression='username = :username',
            ExpressionAttributeValues={
                ':username': {'S': username}
            }
        )

        if 'Items' in response and len(response['Items']) > 0:
            logger.error(f"El nombre de usuario {username} ya existe.")
            return Response(status_code=400, body={'error': f'El username {username} ya existe'}).to_dict()

        user_data = {
            **body,#toda la data validada del body
            'id': str(uuid.uuid4()), #el id requerido en dynamo
            'created_at': datetime.utcnow().isoformat(), # fecha de creacion
            'role': 'TEACHER' # rol por defcto
        }

        password = user_data['password'].encode('utf-8')
        hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())
        user_data['password'] = hashed_password.decode('utf-8')

        user_data_serialized = serialize_to_dynamo(user_data)

        try:
            dyname.put_item(
                TableName=USER_TABLE,
                Item=user_data_serialized,
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

