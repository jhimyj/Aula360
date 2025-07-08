import json
import base64
import logging
import boto3
from boto3.dynamodb.conditions import Key
from utils.response import Response
from utils.token import get_token_instance
from utils.config import STUDENT_TABLE, STUDENT_GSI_INDEX_ROOMID_ID, LIMIT_PAGE_SIZE, ROLE_TEACHER
from utils.dynamo_utils import to_json_serializable

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

token_validator = get_token_instance()
dynamodb = boto3.resource('dynamodb')
students_table = dynamodb.Table(STUDENT_TABLE)

def lambda_handler(event, context):
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de procesamiento de solicitud")

    try:
        headers = event.get('headers', {})
        if 'Authorization' not in headers:
            return Response(
                status_code=401,
                body={
                    "success": False,
                    "code": "UNAUTHORIZED",
                    "message": "No se proporcionó el token de autorización.",
                    "details": [],
                    "request_id": request_id
                }
            ).to_dict()

        auth_header = headers['Authorization']
        token = token_validator.remove_bearer_prefix(auth_header)

        try:
            jwt_decoded = token_validator.decode_token(token)
        except Exception as e:
            logger.error(f"Token inválido: {e}")
            return Response(
                status_code=401,
                body={
                    "success": False,
                    "code": "INVALID_TOKEN",
                    "message": "Token inválido.",
                    "details": [str(e)],
                    "request_id": request_id
                }
            ).to_dict()

        user_id = jwt_decoded.get("id")
        role = jwt_decoded.get("role")

        if role != ROLE_TEACHER:
            return Response(
                status_code=403,
                body={
                    "success": False,
                    "code": "FORBIDDEN_ROLE",
                    "message": "Solo los usuarios con rol TEACHER pueden acceder a esta información.",
                    "details": [],
                    "request_id": request_id
                }
            ).to_dict()
        query_params = event.get('queryStringParameters') or {}
        path_params = event.get('pathParameters') or {}
        room_id = path_params.get("room_id")
        if not room_id:
            return Response(
                status_code=400,
                body={
                    "success": False,
                    "code": "ROOM_ID_REQUIRED",
                    "message": "Se requiere el parámetro room_id.",
                    "details": [],
                    "request_id": request_id
                }
            ).to_dict()

        # --- ROOM CHECK ---
        # try:
        #     room_resp = _service_room.request(
        #         endpoint=f'/rooms/{room_id}',
        #         method="GET",
        #         headers={
        #             'Authorization': auth_header
        #         }
        #     )
        # except Exception as err:
        #     logger.error(f"Error al consultar room {room_id}: {err}")
        #     return Response(
        #         status_code=502,
        #         body={
        #             "success": False,
        #             "code": "ROOM_SERVICE_ERROR",
        #             "message": "Error al comunicarse con el servicio de rooms.",
        #             "details": [str(err)],
        #             "request_id": request_id
        #         }
        #     ).to_dict()
        #
        # room_data = room_resp.get("data")
        # if not room_data:
        #     return Response(
        #         status_code=404,
        #         body={
        #             "success": False,
        #             "code": "ROOM_NOT_FOUND",
        #             "message": "El room especificado no existe.",
        #             "details": [f"room_id '{room_id}' no encontrado."],
        #             "request_id": request_id
        #         }
        #     ).to_dict()
        #
        # if room_data.get("user_id") != user_id:
        #     return Response(
        #         status_code=403,
        #         body={
        #             "success": False,
        #             "code": "NOT_ROOM_OWNER",
        #             "message": "No tienes permiso sobre este room.",
        #             "details": ["Solo el creador del room puede acceder a los estudiantes."],
        #             "request_id": request_id
        #         }
        #     ).to_dict()

        # --- PAGINATED QUERY ---
        size = int(query_params.get("size", 10))
        if size > LIMIT_PAGE_SIZE:
            return Response(
                status_code=400,
                body={
                    "success": False,
                    "code": "PAGE_SIZE_EXCEEDED",
                    "message": f"El tamaño de página no puede ser mayor a {LIMIT_PAGE_SIZE}.",
                    "details": [],
                    "request_id": request_id
                }
            ).to_dict()

        last_evaluated_key = query_params.get("last_evaluated_key")
        query_kwargs = {
            'IndexName': STUDENT_GSI_INDEX_ROOMID_ID,
            'KeyConditionExpression': Key("room_id").eq(room_id),
            'Limit': size
        }

        if last_evaluated_key:
            decoded_key = json.loads(base64.b64decode(last_evaluated_key).decode("utf-8"))
            query_kwargs['ExclusiveStartKey'] = decoded_key

        response = students_table.query(**query_kwargs)
        students = to_json_serializable(response.get("Items", []))

        #calculamos el tamaño de studiantes retornados
        return_size = len(students)
        lek = response.get("LastEvaluatedKey")
        encoded_lek = base64.b64encode(json.dumps(lek).encode("utf-8")).decode("utf-8") if lek else None

        response_data = {
            "students": students,
            "size": return_size,
            "last_evaluated_key": encoded_lek
        }

        return Response(
            status_code=200,
            body={
                "success": True,
                "code": "STUDENT_RETRIEVED",
                "message": "Estudiantes obtenidos exitosamente.",
                "data": response_data,
                "request_id": request_id
            }
        ).to_dict()

    except Exception as e:
        logger.exception("Error inesperado al obtener estudiantes por room.")
        return Response(
            status_code=500,
            body={
                "success": False,
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Ocurrió un error inesperado.",
                "details": [str(e)],
                "request_id": request_id
            }
        ).to_dict()
