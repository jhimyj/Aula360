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
        "add_max_score": {"type": int, "required": False},
        "add_number_questions": {"type": int, "required": False},
        "add_number_students": {"type": int, "required": False}
    }
}

