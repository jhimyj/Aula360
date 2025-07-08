import json
import logging
import boto3
from utils.validator import get_validator_create_room
from schemas.sqs_action import (
    create_validator_sqs_schema_data_update,
    create_validator_key_update
)

from utils.config import ROOM_TABLE
from utils.response import Response
from utils.token import get_token_instance
from utils.exceptions import (
    BadRequestError,
    ValidationError
)

from config.response_error_handler import handle_exception

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

validator_sqs_key_room = create_validator_key_update()
validator_sqs_update_room = create_validator_sqs_schema_data_update()

token_validator = get_token_instance()

dynamodb_resource = boto3.resource('dynamodb')
table = dynamodb_resource.Table(ROOM_TABLE)

SQS_ACTION_PERMITED = {"update"}

###funcines nesasarias:
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
    """
    Genera automáticamente UpdateExpression y ExpressionAttributeValues
    a partir de un diccionario de valores listos para actualizar.

    Si la clave empieza con 'add_', generará una suma acumulativa.

    :param input_values: Diccionario con los valores a actualizar.
    :return: Tuple (UpdateExpression, ExpressionAttributeValues)
    """
    logger.info("construyendo expresion update")
    set_clauses = []
    expression_values = {}

    for key, value in input_values.items():
        placeholder = f":{key}"
        if key.startswith("add__"):
            # Si empieza con add_, quitamos 'add_' para usar el nombre real del campo
            real_field = key[len("add__"):]
            set_clauses.append(f"{real_field} = {real_field} + {placeholder}")
        else:
            set_clauses.append(f"{key} = {placeholder}")

        expression_values[placeholder] = value

    update_expression = "SET " + ", ".join(set_clauses)
    logger.info("consulta construida corectamente")
    return update_expression, expression_values

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

    #construimos las expresiones a updatear
    update_expression, expression_values = build_update_expression(data)

    build_update = {
        "Key": key,
        "UpdateExpression": update_expression,
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
        return Response(
            status_code=200,
            body={
                "success": True,
                "code": "ROOM_UPDATED",
                "message": "room actualizado correctamente",
                "data": data_updated,
                "request_id": request_id
            }
        ).to_dict()
    except Exception as err:
        return handle_exception(err, request_id)



