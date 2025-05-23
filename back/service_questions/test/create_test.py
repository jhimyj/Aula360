# test_lambda_local.py
import os
#variables de entorno
os.environ['QUESTION_TABLE'] = "Question"
os.environ['QUESTION_GSI_INDEX_ROOMID_ID'] = "room_id-id-index"
os.environ['JWT_SECRET_KEY'] = "secret"
os.environ['HTTPS_SERVICE_ROOM'] = "https://iz6hr4i7m9.execute-api.us-east-1.amazonaws.com/dev"
os.environ['QUESTION_GSI_INDEX_ROOMID_CREATEDAT'] = "room_id-created_at-index"
import json
from create.handler import lambda_handler

# Evento de prueba para una pregunta de opción múltiple (selección única)
event = {
    "body": json.dumps({
        "room_id": "6bd0660f-9b32-44bb-a4ac-da9445a8defa",
        "type": "MULTIPLE_CHOICE_SINGLE",
        "text": "¿Cuál es la capital de Francia?",
        "score": 200,
        "tags": ["geografía", "capitales"],
        "difficulty": "EASY",
        "config": {
            "options": ["París", "Londres", "Madrid"]
        }
    }),
    "headers": {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJkM2EwZTUwLWFkMjctNDRhZC1iMjM0LWQ5NTdmODc1NjU1YiIsInJvbGUiOiJURUFDSEVSIiwidXNlcm5hbWUiOiJqdWFucDMiLCJleHAiOjE3NDc3MDk0MjJ9.uEdfQRpbsDvrSsIUGzHhcRU56OBPiGoi1_gax4Prz0M"
    }
}

# Stub de context con un aws_request_id de ejemplo
class Context:
    aws_request_id = "local-test-1"

if __name__ == "__main__":
    response = lambda_handler(event, Context())
    print(json.dumps(response, indent=2, ensure_ascii=False))
