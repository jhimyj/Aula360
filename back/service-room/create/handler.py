import json
import logging
import uuid
import boto3
from datetime import datetime
from utils.validator import get_validator_create_room
from utils.response import Response
from utils.token import get_token_instance
from utils.config import ROOM_TABLE, ROLES_PERMITED_CREATE_ROOM, ROOM_GSI_INDEX_SHORTCODE
from utils.dynamo_utils import serialize_to_dynamo
from utils.helpers import short_id
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

validator_create_room = get_validator_create_room()
token_validator = get_token_instance()

dynamodb_client = boto3.client('dynamodb')

def lambda_handler(event, context):
    """
    Esta función crea un room (sala) en la base de datos DynamoDB
    """
    try:
        body = event.get('body')

        if isinstance(body, str):
            body = json.loads(body)

        if not body:
            return Response(status_code=400, body={
                'error': 'El cuerpo de la solicitud debe contener los parámetros requeridos.'}).to_dict()

        if not validator_create_room.validate(data=body, path='body'):
            logger.error(f"Errores de validación: {validator_create_room.get_errors()}")
            return Response(status_code=400, body={'error': 'Fallo en la validación de los datos proporcionados.',
                                                   'details': validator_create_room.get_errors()}).to_dict()

        headers = event.get('headers')
        if not headers or 'Authorization' not in headers:
            return Response(status_code=400, body={"error": "Falta el encabezado de autorización."}).to_dict()

        auth_header = headers['Authorization']

        token = token_validator.remove_bearer_prefix(auth_header)
        try:
            jwt_decode = token_validator.decode_token(token)
        except ValueError as e:
            logger.error(f"Error al decodificar el token JWT: {str(e)}")
            return Response(status_code=401, body={"error": str(e)}).to_dict()

        user_id = jwt_decode.get('id')
        role = jwt_decode.get('role')
        if not user_id or not role:
            logger.error(f"Faltan los campos user_id o role: {user_id}, {role}")
            return Response(status_code=401, body={"error": "Faltan los campos de usuario (ID) o rol."}).to_dict()

        if role not in ROLES_PERMITED_CREATE_ROOM:
            logger.error(f"Rol no permitido: {role}")
            return Response(status_code=401, body={"error": "Rol no permitido para crear un room."}).to_dict()

        room_data = {
            **body,
            'max_score': 0,
            'number_questions': 0,
            'number_students': 0,
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat(),
        }

        max_attempts = 5
        short_code = None

        for _ in range(max_attempts):
            candidate_code = short_id(iuu_str=str(uuid.uuid4()), length=6)
            response = dynamodb_client.query(
                TableName=ROOM_TABLE,
                IndexName=ROOM_GSI_INDEX_SHORTCODE,
                KeyConditionExpression='short_code = :code',
                ExpressionAttributeValues={':code': {'S': candidate_code}},
                Limit=1
            )
            if response.get('Count', 0) == 0:
                short_code = candidate_code
                break

        if not short_code:
            logger.error("No se pudo generar un shortCode único después de varios intentos.")
            return Response(status_code=500, body={'error': 'No se pudo generar un shortCode único'}).to_dict()

        room_data['short_code'] = short_code

        room_data_serialized = serialize_to_dynamo(room_data)

        try:
            dynamodb_client.put_item(
                TableName=ROOM_TABLE,
                Item=room_data_serialized,
                ConditionExpression="attribute_not_exists(id)"
            )
            logger.info(f"Room creado exitosamente: {room_data['id']} en la tabla {ROOM_TABLE}")

            return Response(status_code=200, body={'message': 'Room creado exitosamente', 'id': room_data['id']}).to_dict()

        except dynamodb_client.exceptions.ConditionalCheckFailedException:
            logger.error(f"El ID del room {room_data['id']} ya existe.")
            return Response(status_code=400, body={'error': f'El ID {room_data["id"]} ya está en uso.'}).to_dict()

    except Exception as e:
        logger.error(f"Error inesperado en el servidor: {e}")
        return Response(status_code=500, body={'message': 'Error interno del servidor.'}).to_dict()

