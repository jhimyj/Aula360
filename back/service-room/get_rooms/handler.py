import json
import logging
import boto3
import base64
from utils.validator import get_validator_create_room
from utils.response import Response
from utils.token import get_token_instance
from utils.config import ROOM_TABLE, ROLES_PERMITED_CREATE_ROOM, LIMIT_PAGE_SIZE, ROOM_GSI_INDEX_USERID_ID
from utils.dynamo_utils import serialize_dynamo_to_dict

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

validator_create_room = get_validator_create_room()
token_validator = get_token_instance()

dynamodb_client = boto3.client('dynamodb')

def lambda_handler(event, context):
    """
        Función Lambda que maneja la consulta paginada de rooms en DynamoDB.
        Recibe parámetros como el tamaño de página (size) y un parámetro opcional last_evaluated_key
        para continuar la paginación desde donde quedó la consulta anterior.
        Valida la autorización del usuario y permite acceder a los datos de rooms de acuerdo a los permisos del rol.
    """

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

        if role not in ROLES_PERMITED_CREATE_ROOM:
            logger.error(f"Rol no permitido: {role}")
            return Response(status_code=403, body={"error": "Rol no permitido para realizar esta acción."}).to_dict()

        query_params = event.get('queryStringParameters')
        if not query_params:
            return Response(status_code=400, body={"error": "Parámetros de consulta no proporcionados."}).to_dict()

        size = int(query_params.get('size', 10))  # Tamaño de página 10 por defecto

        if size > LIMIT_PAGE_SIZE:
            logger.error(f"El tamaño de página {size} excede el límite permitido de {LIMIT_PAGE_SIZE}.")
            return Response(status_code=400, body={"error": f"El tamaño de página no puede ser mayor a {LIMIT_PAGE_SIZE}."}).to_dict()

        last_evaluated_key = query_params.get('last_evaluated_key')  # Recibe el last_evaluated_key si está presente

        query_params_for_dynamo = {
            'TableName': ROOM_TABLE,
            'IndexName': ROOM_GSI_INDEX_USERID_ID,
            'KeyConditionExpression': 'user_id = :user_id',
            'ExpressionAttributeValues': {
                ':user_id': {'S': user_id}
            },
            'Limit': size
        }

        if last_evaluated_key:
            last_evaluated_key = base64.b64decode(last_evaluated_key).decode('utf-8')
            query_params_for_dynamo['ExclusiveStartKey'] = json.loads(last_evaluated_key)

        response = dynamodb_client.query(**query_params_for_dynamo)

        rooms = response.get('Items', [])
        rooms = serialize_dynamo_to_dict(rooms)

        last_evaluated_key = response.get('LastEvaluatedKey', None)

        data = {
            'rooms': rooms,
            'size': size
        }

        if last_evaluated_key:
            encoded_last_evaluated_key = base64.b64encode(json.dumps(last_evaluated_key).encode('utf-8')).decode('utf-8')
            data['last_evaluated_key'] = encoded_last_evaluated_key

        return Response(status_code=200, body={"data": data}).to_dict()

    except Exception as e:
        logger.error(f"Error inesperado en el servidor: {str(e)}")
        return Response(status_code=500, body={'message': 'Error interno del servidor.'}).to_dict()

if __name__ == "__main__":
    event = {
        "headers": {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE0ZTEyZmNlLTVhZmMtNDExYy1iODRiLWQxNjVkMGViMDI4MyIsInJvbGUiOiJURUFDSEVSIiwidXNlcm5hbWUiOiJqdWFucCIsImV4cCI6MTc0NTU4MTk1MX0.fYMXF99p4pADazzUGzyUWhHUd6eP6lv1V57ZOZjByEs",
        },
        "queryStringParameters": {
            "size": 100,
            "last_evaluated_key":"eyJpZCI6IHsiUyI6ICIxODg5Yjg4My03MzkxLTQxOTItOGFkMS02NTRlM2VjNTAzMzgifSwgInVzZXJfaWQiOiB7IlMiOiAiYTRlMTJmY2UtNWFmYy00MTFjLWI4NGItZDE2NWQwZWIwMjgzIn19"
        }
    }

    print(lambda_handler(event, None))
