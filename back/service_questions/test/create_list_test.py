import os
#variables de entorno
os.environ['QUESTION_TABLE'] = "Question"
os.environ['QUESTION_GSI_INDEX_ROOMID_ID'] = "room_id-id-index"
os.environ['JWT_SECRET_KEY'] = "secret"

os.environ['HTTPS_SERVICE_ROOM'] = "https://iz6hr4i7m9.execute-api.us-east-1.amazonaws.com/dev"



import json
from create_list.handler import lambda_handler  # Ajusta el import según tu estructura

class Context:
    aws_request_id = "local-test-batch-1"

if __name__ == "__main__":
    # JWT de prueba (debes usar uno válido o mockear token_validator)
    fake_jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJkM2EwZTUwLWFkMjctNDRhZC1iMjM0LWQ5NTdmODc1NjU1YiIsInJvbGUiOiJURUFDSEVSIiwidXNlcm5hbWUiOiJqdWFucDMiLCJleHAiOjE3NDc2NTc0NjB9.Z3BLX7ZL6fQROTiRGQK7MAcbSzXZcSDLStSmMBrLuWI"

    event = {
        "body": json.dumps({
            "room_id": "6bd0660f-9b32-44bb-a4ac-da9445a8defa",
            "questions": [
                {
                    "type": "MULTIPLE_CHOICE_SINGLE",
                    "text": "¿Cuál es la capital de Perú?",
                    "score": 150,
                    "tags": ["geografía", "capital"],
                    "difficulty": "EASY",
                    "config": {
                        "options": ["Lima", "Cusco", "Arequipa"]
                    }
                },
                {
                    "type": "OPEN_ENDED",
                    "text": "Describe brevemente el ciclo del agua.",
                    "score": 200,
                    "difficulty": "MEDIUM",
                    "config": {
                    }
                }
            ]
        }),
        "headers": {
            "Authorization": f"Bearer {fake_jwt}"
        }
    }

    # Llamada al handler
    response = lambda_handler(event, Context())
    print(json.dumps(response, indent=2, ensure_ascii=False))