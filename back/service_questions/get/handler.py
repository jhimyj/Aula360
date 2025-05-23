import logging
import re
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from utils.response import Response
from utils.config import QUESTION_TABLE, QUESTION_GSI_INDEX_ROOMID_ID
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
    Obtiene una pregunta específica dada room_id y question_id.
    Path parameters: {"room_id": ..., "question_id": ...}
    No requiere autenticación.
    Usa GSI para eficiencia; si falla, cae a get_item.
    """
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de recuperación de pregunta individual (request_id=%s)", request_id)

    try:
        # 1) Validar path parameters
        params = event.get('pathParameters') or {}
        room_id = params.get('room_id')
        question_id = params.get('question_id')
        logger.info("Parámetros recibidos: room_id=%s, question_id=%s", room_id, question_id)

        if not room_id or not question_id:
            logger.error("Faltan parámetros en la ruta")
            return Response(
                status_code=400,
                body={
                    'success': False,
                    'code': 'MISSING_PARAMS',
                    'message': 'Faltan parámetros en la ruta.',
                    'details': ['Debe incluir room_id y question_id.'],
                    'request_id': request_id
                }
            ).to_dict()

        if not UUID_PATTERN.match(room_id) or not UUID_PATTERN.match(question_id):
            logger.error("Formato de UUID inválido")
            return Response(
                status_code=400,
                body={
                    'success': False,
                    'code': 'INVALID_PARAMS',
                    'message': 'Parámetros inválidos.',
                    'details': ['room_id y question_id deben ser UUID v4 válidos.'],
                    'request_id': request_id
                }
            ).to_dict()

        item = None
        index_name = QUESTION_GSI_INDEX_ROOMID_ID
        logger.info("Consultando GSI %s", index_name)

        # 2) Intentar consulta por GSI
        try:
            resp = questions_table.query(
                IndexName=index_name,
                KeyConditionExpression=(
                    Key('room_id').eq(room_id) &
                    Key('id').eq(question_id)
                ),
                Limit=1
            )
            items = resp.get('Items', [])
            if items:
                item = items[0]
                logger.info("Pregunta encontrada vía GSI: %s", question_id)
            else:
                logger.info("No encontrada vía GSI, se intentará get_item")
        except ClientError as e:
            logger.warning(
                "Error al consultar GSI (%s); usando get_item: %s",
                e.response['Error']['Code'], e
            )


        # 3) Evaluar existencia
        if not item:
            logger.error("Pregunta no encontrada en ninguna consulta")
            return Response(
                status_code=404,
                body={
                    'success': False,
                    'code': 'QUESTION_NOT_FOUND',
                    'message': 'La pregunta no existe.',
                    'details': [
                        f"No encontrada: room_id={room_id}, id={question_id}"
                    ],
                    'request_id': request_id
                }
            ).to_dict()

        #serializamos el item
        item_serialized = to_json_serializable(item)
        # 4) Responder con el ítem encontrado
        logger.info("Devolviendo pregunta exitosa")
        return Response(
            status_code=200,
            body={
                'success': True,
                'code': 'QUESTION_FETCHED',
                'message': 'Pregunta obtenida correctamente.',
                'data': item_serialized,
                'request_id': request_id
            }
        ).to_dict()

    except Exception as e:
        logger.exception(f"Error inesperado al recuperar pregunta: {e}")
        return Response(
            status_code=500,
            body={
                'success': False,
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'Ocurrió un error interno.',
                'details': ['Ha ocurrido un problema inesperado al procesar tu solicitud.'],
                'request_id': request_id
            }
        ).to_dict()