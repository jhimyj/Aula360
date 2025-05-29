import os


##variables de entorno

RESPONSE_TABLE = os.environ['RESPONSE_TABLE']
RESPONSE_GSI_INDEX_QUESTIONID_ROOMIDSTUDENTID = os.environ['RESPONSE_GSI_INDEX_QUESTIONID_ROOMIDSTUDENTID']
HTTPS_SERVICE_QUESTION = os.environ['HTTPS_SERVICE_QUESTION']
JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']
ANTHROPIC_API_KEY = os.environ['ANTHROPIC_API_KEY']


JWT_EXPIRATION_TIME = 3600*6
JWT_ALGORITHM = "HS256"
LIMIT_PAGE_SIZE = 100
MAX_TOKENS_NOVA = 1000
MAX_TOKENS_ANTHROPIC = 1000
MODEL_IA_NOVA = "amazon.nova-pro-v1:0"
#permisos  y configuraciones iniciales


HEADERS_RESPONSE_DEFAULT = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True
        }

DATA_QUESTION_REQUIRED = ["type", "difficulty", "text", "score", "config", "tags"]

#schemas de validacion

"""validadores de resquest"""



response_student_schema = {
    "type": dict,
    "schema": {
        "room_id": {"type": str, "required": True},
        "question_id": {"type": str, "required": True},
        "response_student": {
            "type": list,
            "minlength": 1,
            "maxlength": 5,
            "schema": {"type": str},
            "required": True
        }
    }
}



