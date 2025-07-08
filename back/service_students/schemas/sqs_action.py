from utils.validator import CustomValidator
key = {
    "type": dict,
    "schema": {
        "id": {"type": str}
    }
}

data_update = {
    "type": dict,
    "schema": {
        "name": {"type": str, "required": False},
        "topic": {"type": str, "required": False},
        "description": {"type": str, "required": False},
        "add__max_score": {"type": int, "required": False},
        "add__number_questions": {"type": int, "required": False},
        "add__number_students": {"type": int, "required": False}
    }
}


def create_validator_sqs_schema_data_update():
    return CustomValidator(schema=data_update)

def create_validator_key_update():
    return CustomValidator(schema=key)