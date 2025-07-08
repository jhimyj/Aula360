import logging
import re
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from utils.response import Response
from utils.config import QUESTION_TABLE, QUESTION_GSI_INDEX_ROOMID_CREATEDAT
from utils.dynamo_utils import to_json_serializable

# Configurar logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Inicializar recursos de DynamoDB
dynamodb = boto3.resource('dynamodb')
questions_table = dynamodb.Table(QUESTION_TABLE)

# Patrón para validar UUID v4
def _compile_uuid_pattern():
    return re.compile(
        r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
        r"[0-9a-fA-F]{12}$"
    )
UUID_PATTERN = _compile_uuid_pattern()


def lambda_handler(event, context):
    """
    Obtiene todas las preguntas asociadas a un room_id.
    Path parameter: {"room_id": ...}
    Devuelve lista ordenada por 'created_at'.
    """
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de recuperación de preguntas de room (request_id=%s)", request_id)

    # Validar path parameter
    params = event.get('pathParameters') or {}
    room_id = params.get('room_id')
    if not room_id:
        logger.error("Falta room_id en path parameters")
        return Response(
            status_code=400,
            body={
                'success': False,
                'code': 'MISSING_PARAM',
                'message': 'Falta room_id en la ruta.',
                'details': ['Debe incluir room_id como path parameter.'],
                'request_id': request_id
            }
        ).to_dict()

    if not UUID_PATTERN.match(room_id):
        logger.error("Formato de room_id inválido: %s", room_id)
        return Response(
            status_code=400,
            body={
                'success': False,
                'code': 'INVALID_PARAM',
                'message': 'room_id inválido.',
                'details': ['room_id debe ser un UUID v4 válido.'],
                'request_id': request_id
            }
        ).to_dict()

    # Query al GSI por room_id
    index_name = QUESTION_GSI_INDEX_ROOMID_CREATEDAT
    items = []
    last_key = None
    try:
        while True:
            query_args = {
                'IndexName': index_name,
                'KeyConditionExpression': Key('room_id').eq(room_id),
                'ScanIndexForward': True
            }
            if last_key:
                query_args['ExclusiveStartKey'] = last_key
            resp = questions_table.query(**query_args)
            batch = resp.get('Items', [])
            items.extend(batch)
            last_key = resp.get('LastEvaluatedKey')
            if not last_key:
                break
    except ClientError as e:
        logger.exception("Error al consultar preguntas de DynamoDB")
        return Response(
            status_code=500,
            body={
                'success': False,
                'code': 'DYNAMODB_ERROR',
                'message': 'Error al recuperar las preguntas.',
                'details': [e.response['Error']['Message']],
                'request_id': request_id
            }
        ).to_dict()
    except Exception as e:
        logger.exception("Error inesperado al recuperar preguntas")
        return Response(
            status_code=500,
            body={
                'success': False,
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'Ocurrió un error interno.',
                'details': ['Ha ocurrido un problema al procesar tu solicitud.'],
                'request_id': request_id
            }
        ).to_dict()

    # Convertir decimals y fechas
    items = to_json_serializable(items)

    # Respuesta exitosa
    return Response(
        status_code=200,
        body={
            'success': True,
            'code': 'QUESTIONS_LIST_FETCHED',
            'message': 'Preguntas obtenidas correctamente.',
            'data': items,
            'request_id': request_id
        }
    ).to_dict()