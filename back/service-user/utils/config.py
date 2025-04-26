import os

USER_TABLE = os.environ['USER_TABLE']
USER_GSI_INDEX_USERNAME = os.environ['USER_GSI_INDEX_USERNAME']
JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']
JWT_EXPIRATION_TIME = 3600*6
JWT_ALGORITHM = "HS256"
HEADERS_RESPONSE_DEFAUL = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True
        }

"""validadores de resquest"""
schema_register_user = {
    'type': dict,
    'schema':{
        'name': {'type': str, 'minlength': 2, 'maxlength': 16},
        'last_name':{'type': str, 'minlength': 2, 'maxlength': 16},
        'password':{'type': str, 'minlength': 6, 'maxlength': 50},
        'username':{'type': str, 'minlength': 4, 'maxlength': 16}
    }
}

schema_login_user = {
    'type': dict,
    'schema': {
        'password': {'type': str, 'minlength': 6, 'maxlength': 50},
        'username': {'type': str, 'minlength': 4, 'maxlength': 16}
    }
}
