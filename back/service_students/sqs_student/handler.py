import json
import logging
import boto3
from datetime import datetime


from schemas.sqs_action import (
    create_validator_sqs_schema_data_update,
    create_validator_key_update
)

from utils.config import (
    STUDENT_TABLE
)
from utils.response import Response
from utils.token import get_token_instance
from exceptions.exceptions import (
    BadRequestError,
    ValidationError,
    NotFound
)

from config.response_error_handler import handle_exception

from serializers.dynamo_serializer import DynamoSerializer


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

validator_sqs_key_room = create_validator_key_update()
validator_sqs_update_room = create_validator_sqs_schema_data_update()

token_validator = get_token_instance()

ROOM_TABLE = "Room"
dynamodb_resource = boto3.resource('dynamodb')
table = dynamodb_resource.Table(STUDENT_TABLE)
room_table = dynamodb_resource.Table(ROOM_TABLE)

serializer = DynamoSerializer()

SQS_ACTION_PERMITED = {"update"}


###funcines nesasarias
def parse_and_validate_event(event):
    records = event.get("Records", [])

    if len(records) != 1:
        raise BadRequestError("Debe haber exactamente un record")

    body = records[0].get("body")
    if not body:
        raise BadRequestError("El cuerpo de la solicitud es obligatorio.")

    if isinstance(body, str):
        try:
            body = json.loads(body)
        except json.JSONDecodeError:
            raise BadRequestError("El cuerpo debe ser JSON válido.")

    if not isinstance(body, dict) or not body:
        raise BadRequestError("El cuerpo JSON no puede estar vacío.")

    action = body.get("action")
    if action not in SQS_ACTION_PERMITED:
        raise BadRequestError(f"Acción '{action}' no permitida.")

    key = body.get("key")
    if not key:
        raise BadRequestError("la clave de filtro es obligatorio.")

    data = body.get("data")
    if not data:
        raise BadRequestError(f"El campo 'data' es requerido para la accion de {action}")

    return action, key, data


def build_update_expression(input_values: dict):
    logger.info("Construyendo expresión de actualización...")

    set_clauses = []
    expression_values = {}
    expression_names = {}

    for key, value in input_values.items():
        placeholder_value = f":{key}"

        if key.startswith("add__"):
            real_field = key[len("add__"):]
            placeholder_name = f"#{real_field}"
            expression_names[placeholder_name] = real_field
            set_clauses.append(f"{placeholder_name} = {placeholder_name} + {placeholder_value}")
        else:
            placeholder_name = f"#{key}"
            expression_names[placeholder_name] = key
            set_clauses.append(f"{placeholder_name} = {placeholder_value}")

        expression_values[placeholder_value] = value

    update_expression = "SET " + ", ".join(set_clauses)

    logger.info("Expresión de actualización construida correctamente.")
    return update_expression, expression_names, expression_values

def update_data(key, data):
    logger.info("actualizando valore de room")
    if not validator_sqs_key_room.validate(key):
        logger.error(f"Errores de validación: {validator_sqs_key_room.get_errors()}")
        errs = validator_sqs_key_room.get_errors()
        details = " ".join(f"{field}: {' '.join(msgs)}" for field, msgs in errs.items())
        raise ValidationError(f"Errores de validación: {details}")

    if not validator_sqs_update_room.validate(data):
        logger.error(f"Errores de validación: {validator_sqs_update_room.get_errors()}")
        errs = validator_sqs_update_room.get_errors()
        details = " ".join(f"{field}: {' '.join(msgs)}" for field, msgs in errs.items())
        raise ValidationError(f"Errores de validación: {details}")

    #sacamos datos de estudiante
    try:
        response_student = table.get_item(Key=key)
        student = response_student.get("Item")
    except Exception as e:
        logger.error(f"error al obtener datos del estudiantes{e}")
        raise

    if not student:
        raise NotFound(f"estudiantes no encontrado")


    try:
        room_id = key["room_id"]
        response_room = room_table.get_item(Key={
            "id": room_id
        })
        room = response_room.get("Item")
    except Exception as e:
        logger.error(f"error al obtener datos del room{e}")
        raise

    if not student:
        raise NotFound(f"estudiante no encontrado")

    if not room:
        raise NotFound(f"room no encontrado")

    room_serializer = serializer.serialize(room)
    student_serializer = serializer.serialize(student)

    student_status = student_serializer.get("status", "")
    if student_status == "CREATED":
        data["status"] = "IN_PROGRESS"

    number_questions = room_serializer.get("number_questions", 0)
    answered_questions_count = student_serializer.get("answered_questions_count", 0) + data.get("add__answered_questions_count", 0)
    if answered_questions_count >= number_questions:
        data["status"] = "COMPLETED"

    #agregamso la fecha de actualizacion
    now = datetime.utcnow().isoformat()
    data["updated_at"] = now

    #construimos las expresiones a updatear
    update_expression, expression_names, expression_values = build_update_expression(data)

    build_update = {
        "Key": key,
        "UpdateExpression": update_expression,
        "ExpressionAttributeNames": expression_names,
        "ExpressionAttributeValues": expression_values,
        "ReturnValues": "UPDATED_NEW"
    }

    response = table.update_item(**build_update)
    logger.info("actualizado exitosamente")

    return response["Attributes"]


actions = {
    "update": update_data
}
def lambda_handler(event, context):
    """
    Esta función crea un room (sala) en la base de datos DynamoDB
    """
    request_id = getattr(context, "aws_request_id", "unknown")
    logger.info(f"Inicio procesamiento - Request ID: {request_id}")
    try:
        logger.info("parseando el mensaje")
        action, key, data = parse_and_validate_event(event)

        data_updated = actions[action](key, data)

        data_updated_serializer = serializer.serialize(data_updated)

        return Response(
            status_code=200,
            body={
                "success": True,
                "code": "STUDENT_UPDATED",
                "message": "room actualizado correctamente",
                "data": data_updated_serializer,
                "request_id": request_id
            }
        ).to_dict()
    except Exception as err:
        return handle_exception(err, request_id)



