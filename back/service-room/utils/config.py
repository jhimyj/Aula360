import os

ROOM_TABLE = os.environ['ROOM_TABLE']
ROOM_GSI_INDEX_USERID_ID= os.environ['ROOM_GSI_INDEX_USERID_ID']
JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']
JWT_EXPIRATION_TIME = 3600*6
JWT_ALGORITHM = "HS256"
LIMIT_PAGE_SIZE = 100

ROLES_PERMITED_CREATE_ROOM = {'TEACHER'}

HEADERS_RESPONSE_DEFAULT = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True
        }


"""validadores de resquest"""

schema_create_room = {
    'type': dict,
    'schema': {
        'name': {'type': str, 'minlength': 1, 'maxlength': 16},
        'course': {'type': str, 'minlength': 2, 'maxlength': 20},
        'topic': {'type': str, 'minlength': 2, 'maxlength': 20},
        'description': {'type': str, 'minlength': 4, 'maxlength': 100}
    }
}

