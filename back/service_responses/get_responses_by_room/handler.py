import logging
import boto3

from boto3.dynamodb.conditions import Key

from utils.response import Response
from utils.token import get_token_instance
from utils.config import RESPONSE_TABLE, RESPONSE_GSI_INDEX_ROOMID_QUESTIONID

from serializers.dynamo_serializer import DynamoSerializer

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

token_validator = get_token_instance()
dynamodb = boto3.resource('dynamodb')
response_table = dynamodb.Table(RESPONSE_TABLE)

serializer = DynamoSerializer()



def lambda_handler(event, context):
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de procesamiento de solicitud")

    try:
        path_parameters = event.get('pathParameters') or {}
        if "room_id" not in path_parameters:
            logger.error("Cabecera Authorization ausente")
            return Response(
                status_code=401,
                body={
                    "success": False,
                    "code": "PARAMETERS_MISSING",
                    "message": "room_id son requeridos.",
                    "details": ["Incluye room_id en la url'."],
                    "request_id": request_id
                }
            ).to_dict()
        room_id = path_parameters.get('room_id')

        # --- AUTORIZACIoN ---
        headers = event.get('headers') or {}
        auth_header = headers.get('Authorization')
        if not auth_header:
            logger.error("Cabecera Authorization ausente")
            return Response(
                status_code=401,
                body={
                    "success": False,
                    "code": "AUTH_HEADER_MISSING",
                    "message": "Falta la cabecera de autorización.",
                    "details": ["Incluye el token JWT en 'Authorization'."],
                    "request_id": request_id
                }
            ).to_dict()

        token = token_validator.remove_bearer_prefix(auth_header)
        try:
            jwt_payload = token_validator.decode_token(token)
        except ValueError as err:
            logger.error(f"Token JWT inválido: {err}")
            return Response(
                status_code=401,
                body={
                    "success": False,
                    "code": "INVALID_TOKEN",
                    "message": "No se pudo decodificar el token JWT.",
                    "details": [str(err)],
                    "request_id": request_id
                }
            ).to_dict()

        user_id = jwt_payload.get('id')
        role = jwt_payload.get('role')
        if not user_id or not role:
            logger.error(f"JWT sin 'id' o 'role' ({user_id}, {role})")
            return Response(
                status_code=401,
                body={
                    "success": False,
                    "code": "MISSING_CLAIMS",
                    "message": "El token JWT no contiene los campos obligatorios.",
                    "details": ["Asegúrate de incluir 'id' y 'role' en el JWT."],
                    "request_id": request_id
                }
            ).to_dict()
        if role != "TEACHER":
            logger.warning(f"Rol no autorizado: {role}")
            return Response(
                status_code=403,
                body={
                    "success": False,
                    "code": "ROLE_NOT_PERMITTED",
                    "message": "No tienes permiso para realizar esta operación.",
                    "details": [f"El rol '{role}' no está permitido."],
                    "request_id": request_id
                }
            ).to_dict()

        response_bd = []
        last_evaluated_key = None
        limit_for = 15

        for _ in range(0, limit_for):
            query_params = {
                'IndexName': RESPONSE_GSI_INDEX_ROOMID_QUESTIONID,
                'KeyConditionExpression': Key('room_id').eq(f'{room_id}')
            }

            if last_evaluated_key:
                query_params['ExclusiveStartKey'] = last_evaluated_key

            response = response_table.query(**query_params)
            response_bd.extend(response['Items'])

            last_evaluated_key = response.get('LastEvaluatedKey')
            if not last_evaluated_key:
                break

        response_by_question = {}

        # agrupamos por question_id
        for response in response_bd:
            if response["question_id"] not in response_by_question:
                response_by_question[response["question_id"]] = []
            response_by_question[response["question_id"]].append(response)



        response_by_question_serialiser = serializer.serialize(response_by_question)

        return Response(
            status_code=200,
            body={
                "success": True,
                "code": "FETCH_RESPONSES_BY_QUESTIONS",
                "message": "Respuestas por preguntas obtenidas correctamentes.",
                "data": response_by_question_serialiser,
                "request_id": request_id
            }
        ).to_dict()
    except Exception as e:
        logger.exception(f"Error inesperado en el servidor: {e}")
        return Response(
            status_code=500,
            body={
                "success": False,
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Se produjo un error interno.",
                "details": ["Error inesperado, por favor reporte el incidente."],
                "request_id": request_id
            }
        ).to_dict()


