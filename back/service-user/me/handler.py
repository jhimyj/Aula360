import logging
import os
import boto3
import jwt

from utils.response import Response
from utils.dynamo_utils import serialize_dynamo_to_dict

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dyname = boto3.client('dynamodb')
USER_TABLE = os.environ['USER_TABLE']
SECRET_KEY = os.environ['SECRET_KEY']

TOKEN_EXPIRATION = 30


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
        if not auth_header.startswith("Bearer "):
            return Response(status_code=400,
                            body={"error": "Invalid Authorization header format. Must be Bearer <token>"})

        token = auth_header.split(" ")[1]

        try:
            jwt_decode = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response(status_code=401, body={"error": "Token has expired"})
        except jwt.InvalidTokenError:
            return Response(status_code=401, body={"error": "Invalid token"})

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

if __name__ == '__main__':
    event = {
        'headers':{
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE0ZTEyZmNlLTVhZmMtNDExYy1iODRiLWQxNjVkMGViMDI4MyIsInJvbGUiOiJURUFDSEVSIiwidXNlcm5hbWUiOiJqdWFucCIsImV4cCI6MTc0NTUyMTAyN30.mw3rBGsdD8MXB3HEMHAlFpl0cWyNwGH9HAnrW2rucBI',
        }
    }

    print(lambda_handler(event, None))