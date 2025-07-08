from utils.validator import CustomValidator
key = {
    "type": dict,
    "schema": {
        "id": {"type": str},
        "room_id": {"type": str}
    }
}


data_update = {
    "type": dict,
    "schema": {
        "status": {"type": str, "required": False},
        "add__score_student": {"type": int, "required": False},
        "add__score_villain": {"type": int, "required": False},
        "add__answered_questions_count": {"type": int, "required": False}
    }
}


def create_validator_sqs_schema_data_update():
    return CustomValidator(schema=data_update)

def create_validator_key_update():
    return CustomValidator(schema=key)