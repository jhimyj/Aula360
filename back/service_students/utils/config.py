import os


##variables de entorno
STUDENT_TABLE = os.environ['STUDENT_TABLE']
STUDENT_GSI_INDEX_ROOMID_ID = os.environ['STUDENT_GSI_INDEX_ROOMID_ID']
STUDENT_GSI_INDEX_USERNAME_ROOMID = os.environ['STUDENT_GSI_INDEX_USERNAME_ROOMID']

JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']
JWT_EXPIRATION_TIME = 3600*6
JWT_ALGORITHM = "HS256"
LIMIT_PAGE_SIZE = 100
HTTPS_SERVICE_ROOM = os.environ['HTTPS_SERVICE_ROOM']

#permisos  y configuraciones iniciales
ROLE_TEACHER = 'TEACHER'
ROLE_STUDENT = "STUDENT"

HEADERS_RESPONSE_DEFAULT = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True
        }

#schemas de validacion
"""validadores de resquest"""

#validacion de request de create user
schema_create_student = {
    "type": dict,
    "schema": {
        "room_id": {"type": str, "required": True},
        "username": {"type": str, "required": True},
        "data": {"type": dict, "validate_schema": False},
    }
}

schema_login = {
    "type": dict,
    "schema": {
        "room_id": {"type": str, "required": True},
        "username": {"type": str, "required": True}
    }
}

