import json
import logging
import uuid
import boto3
from datetime import datetime
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from requests.exceptions import HTTPError

from utils.validator import (
    create_validator_schema_create_student
)
from utils.response import Response
from utils.token import get_token_instance
from utils.config import (
    STUDENT_TABLE,
    STUDENT_GSI_INDEX_USERNAME_ROOMID,
    ROLE_STUDENT,
    URL_SQS_ROOM
)
from utils.external_api import create_external_api_client_room

from utils.send_message_sqs import send_single_message_to_sqs_fifo

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

token_validator = get_token_instance()

# DynamoDB Resource
dynamodb = boto3.resource('dynamodb')
students_table = dynamodb.Table(STUDENT_TABLE)

_validator_student = create_validator_schema_create_student()
_service_room = create_external_api_client_room()


def lambda_handler(event, context):
    """
    Esta función crea una question en la base de datos DynamoDB usando el recurso de alto nivel.
    """
    request_id = getattr(context, 'aws_request_id', 'unknown')
    logger.info("Inicio de procesamiento de solicitud")

    try:
        # --- BODY & JSON PARSING ---
        body = event.get('body')
        if body is None:
            logger.error("Parámetro 'body' ausente en el evento")
            return Response(
                status_code=400,
                body={
                    "success": False,
                    "code": "BODY_MISSING",
                    "message": "El cuerpo de la solicitud es obligatorio.",
                    "details": ["Incluye un JSON en el body de la petición."],
                    "request_id": request_id
                }
            ).to_dict()

        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError as err:
                logger.error(f"JSON inválido: {err}")
                return Response(
                    status_code=400,
                    body={
                        "success": False,
                        "code": "INVALID_JSON",
                        "message": "El cuerpo de la solicitud debe ser JSON válido.",
                        "details": ["Revisa la sintaxis JSON en el cuerpo de la petición."],
                        "request_id": request_id
                    }
                ).to_dict()

        if not isinstance(body, dict) or not body:
            logger.error("Cuerpo JSON vacío o formato incorrecto")
            return Response(
                status_code=400,
                body={
                    "success": False,
                    "code": "EMPTY_BODY",
                    "message": "El cuerpo JSON no puede estar vacío.",
                    "details": ["Proporciona al menos una propiedad en el JSON."],
                    "request_id": request_id
                }
            ).to_dict()

        # --- VALIDACIONES ---
        if not _validator_student.validate(data=body, path='body'):
            errors = _validator_student.get_errors()
            logger.error(f"Falló validación de student: {errors}")
            user_errors = [f"Campo '{f}': {' '.join(msgs)}" for f, msgs in errors.items()]
            return Response(
                status_code=400,
                body={
                    "success": False,
                    "code": "VALIDATION_ERROR",
                    "message": "Datos de student inválidos.",
                    "details": user_errors,
                    "request_id": request_id
                }
            ).to_dict()


        username = body['username']
        room_code = body['room_code']

        student_id = str(uuid.uuid4())
        # creamos token solo para validar que room con code exista

        payload = {
            'id': student_id,
            'role': ROLE_STUDENT,
            'username': username
        }
        token = token_validator.generate_token(payload)

        bearer_token = f'Bearer {token}'

        # --- ROOM CHECK ---
        try:
            room_resp = _service_room.request(
                endpoint=f'/rooms/code/{room_code}',
                method="GET",
                headers={
                    'Authorization': bearer_token
                }
            )
        except HTTPError as errorhttp:
            logger.error(f"Error al consultar room con code {room_code}: {errorhttp}")
            if errorhttp.response is not None:
                if errorhttp.response.status_code == 404:
                    return Response(
                        status_code=404,
                        body={
                            "success": False,
                            "code": "ROOM_NOT_FOUND",
                            "message": "No existe el room especificado.",
                            "details": ["verifica que el code sea valido"],
                            "request_id": request_id
                        }
                    ).to_dict()

            return Response(
                status_code=502,
                body={
                    "success": False,
                    "code": "ROOM_SERVICE_ERROR",
                    "message": "Error al comunicarse con el servicio de rooms.",
                    "details": [str(errorhttp)],
                    "request_id": request_id
                }
            ).to_dict()

        except Exception as err:
            logger.error(f"Error al consultar room con code {room_code}: {err}")
            return Response(
                status_code=502,
                body={
                    "success": False,
                    "code": "ROOM_SERVICE_ERROR",
                    "message": "Error al comunicarse con el servicio de rooms.",
                    "details": [str(err)],
                    "request_id": request_id
                }
            ).to_dict()

        room_data = room_resp.get("data")
        if not room_data:
            logger.error(f"Room con code {room_code} no encontrado o sin datos")
            return Response(
                status_code=404,
                body={
                    "success": False,
                    "code": "ROOM_NOT_FOUND",
                    "message": "El room especificado no existe.",
                    "details": [f"room_code '{room_code}' no encontrado."],
                    "request_id": request_id
                }
            ).to_dict()
        #extraemos el id del room
        room_id = room_data["id"]
        body["room_id"] = room_id


        del body["room_code"]

        # --- Verificar existencia previa del usuario ---
        try:
            response_bd = students_table.query(
                IndexName=STUDENT_GSI_INDEX_USERNAME_ROOMID,
                KeyConditionExpression=Key('username').eq(username) & Key('room_id').eq(room_id),
                Limit=1,
                ConsistentRead=False
            )
        except ClientError as e:
            logger.error(f"Error al consultar DynamoDB (username={username}, room_id={room_id}): {e}")
            return Response(
                status_code=500,
                body={
                    "success": False,
                    "code": "DYNAMODB_QUERY_ERROR",
                    "message": "No se pudo consultar si el nombre de usuario ya existe.",
                    "details": ["Error al acceder a datos. Inténtalo de nuevo."],
                    "request_id": request_id
                }
            ).to_dict()

        if 'Items' in response_bd and len(response_bd['Items']) > 0:
            logger.warning(f"Usuario duplicado detectado: username={username}, room_id={room_id}")
            return Response(
                status_code=409,
                body={
                    "success": False,
                    "code": "USER_EXIST",
                    "message": "El nombre de usuario ya existe.",
                    "details": ["El nombre de usuario ya está en uso. Por favor elige otro."],
                    "request_id": request_id
                }
            ).to_dict()

        # --- CREACIÓN DE LA STUDENT ---
        now = datetime.utcnow().isoformat()
        student_data = {
            **body,
            "id": student_id,
            "status": "CREATED",
            'role': ROLE_STUDENT,
            "score_student": 0,
            "score_villain": 0,
            "answered_questions_count": 0,
            "created_at": now,
            "updated_at": now
        }

        # Inserción usando recurso de alto nivel
        try:
            students_table.put_item(
                Item=student_data,
                ConditionExpression="attribute_not_exists(id)"
            )
            logger.info(
                f"Student creado exitosamente en DynamoDB: id={student_id}, username={username}, room_id={room_id}")

            try:
                message = {
                    "action": "update",
                    "key": {
                        "id": room_id
                    },
                    "data": {
                        "add__number_students": 1
                    }
                }
                send_single_message_to_sqs_fifo(queue_url=URL_SQS_ROOM, message=message, num_groups=10)
            except Exception as err:
                logger.error(f"error al enviar mensaje a la cola de rooms{err}")


            return Response(
                status_code=201,
                body={
                    "success": True,
                    "code": "STUDENT_CREATED",
                    "message": "Estudiante creado exitosamente.",
                    "data": {"id": student_id, "token": token, "student": student_data},
                    "request_id": request_id
                }
            ).to_dict()

        except ClientError as e:

            error_code = e.response['Error']['Code']
            logger.error(f"Error al insertar en DynamoDB (id={student_id}): {error_code} - {e}")
            if error_code == 'ConditionalCheckFailedException':
                return Response(
                    status_code=409,
                    body={
                        "success": False,
                        "code": "DUPLICATE_STUDENT",
                        "message": "El ID del estudiante ya existe.",
                        "details": [f"ID '{student_id}' duplicado."],
                        "request_id": request_id
                    }

                ).to_dict()

            else:
                return Response(
                    status_code=500,
                    body={
                        "success": False,
                        "code": "DYNAMODB_ERROR",
                        "message": "Error al escribir en la tabla de estudiantes.",
                        "details": ["Ocurrió un error inesperado en DynamoDB."],
                        "request_id": request_id
                    }
                ).to_dict()

    except Exception as e:
        logger.exception(f"Error inesperado en servidor: {e}")
        return Response(
            status_code=500,
            body={
                "success": False,
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Se produjo un error interno.",
                "details": ["error inesperado reporte el error."],
                "request_id": request_id
            }
        ).to_dict()
