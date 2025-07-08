import  os
os.environ['QUESTION_TABLE'] = "Question"
os.environ['QUESTION_GSI_INDEX_ROOMID_ID'] = "room_id-id-index"
os.environ['JWT_SECRET_KEY'] = "secret"
os.environ['HTTPS_SERVICE_ROOM'] = "https://iz6hr4i7m9.execute-api.us-east-1.amazonaws.com/dev"
os.environ['QUESTION_GSI_INDEX_ROOMID_CREATEDAT'] = "room_id-created_at-index"
import json
from get.handler import lambda_handler  # Ajusta el import según tu estructura

class Context:
    aws_request_id = "local-test-get-1"

if __name__ == "__main__":
    # Reemplaza estos UUIDs por valores que realmente existan en tu tabla
    room_id = "6bd0660f-9b32-44bb-a4ac-da9445a8defa"
    question_id = "fb505345-8261-45bf-a25e-79caa455fb35"

    event = {
        "pathParameters": {
            "room_id": room_id,
            "question_id": question_id
        }
    }

    response = lambda_handler(event, Context())
    print(json.dumps(response, indent=2, ensure_ascii=False))
