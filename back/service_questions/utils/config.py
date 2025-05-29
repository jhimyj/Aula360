import os


##variables de entorno
QUESTION_TABLE = os.environ['QUESTION_TABLE']
QUESTION_GSI_INDEX_ROOMID_ID = os.environ['QUESTION_GSI_INDEX_ROOMID_ID']
QUESTION_GSI_INDEX_ROOMID_CREATEDAT = os.environ['QUESTION_GSI_INDEX_ROOMID_CREATEDAT']
HTTPS_SERVICE_ROOM = os.environ['HTTPS_SERVICE_ROOM']
JWT_SECRET_KEY = os.environ['JWT_SECRET_KEY']
ANTHROPIC_API_KEY = os.environ['ANTHROPIC_API_KEY']

ANTHROPIC_MODEL = "claude-3-7-sonnet-20250219"
JWT_EXPIRATION_TIME = 3600*6
JWT_ALGORITHM = "HS256"
LIMIT_PAGE_SIZE = 100
MAX_TOKENS_NOVA = 1000
MAX_TOKENS_ANTHROPIC = 1000

#permisos  y configuraciones iniciales
ROLES_PERMITED_CREATE_QUESTION = {'TEACHER'}

HEADERS_RESPONSE_DEFAULT = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True
        }

#schemas de validacion

"""validadores de resquest"""

QUESTION_TYPES = {
    "MULTIPLE_CHOICE_SINGLE",    # Selección única
    "MULTIPLE_CHOICE_MULTIPLE",  # Selección múltiple
    "OPEN_ENDED"                # Respuesta abierta
}

DIFFICULTY_TYPES = {"EASY", "MEDIUM", "HARD"}
schema_question = {
    'type': dict,
    'schema': {
        'room_id': {'type': str},
        'type': {'type': str, 'choices': QUESTION_TYPES},
        'text': {'type': str},
        'score': {'type': int, 'min': 100, 'max': 1000},
        'tags': {'type': list, 'schema': {'type': str}, 'required': False},
        'difficulty': {'type': str, 'choices': DIFFICULTY_TYPES},
        'config': {'type': dict, 'validate_schema': False}
    }
}

schema_config_multiple_choice_single = {
    'type': dict,
    'schema': {
        'options': {
            'type': list,
            'minlength': 2,
            'maxlength': 5,
            'schema': {
                'type': str
            }
        }
    }
}

schema_config_open_ended = {
    'type': dict,
    'schema': {}
}



#squemas validadores para insertar multiples preguntas
schema_question_list = {
    'type': dict,
    'schema': {
        'room_id': {'type': str},
        'questions': {'type': list}
    }
}

schema_question_item = {
    'type': dict,
    'schema': {
        'type': {'type': str, 'choices': QUESTION_TYPES},
        'text': {'type': str},
        'score': {'type': int, 'min': 100, 'max': 1000},
        'tags': {'type': list, 'schema': {'type': str}, 'required': False},
        'difficulty': {'type': str, 'choices': DIFFICULTY_TYPES},
        'config': {'type': dict, 'validate_schema': False}
    }
}


recommendation_ia_question_schema = {
    "type": dict,
    "schema": {
        "room_id": {"type": str},
        "user_prompt": {"type": str, "required": True}
    }
}
