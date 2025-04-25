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





# schema = {
#     "type": dict,
#     "schema": {
#         'name': {'type': str, 'minlength': 2, 'maxlength': 50},
#         'email': {'type': str, 'regex': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'},
#         'addresses': {
#             'type': list,
#             'schema': {
#                 'type': dict,
#                 'minlength':1,
#                 'schema': {
#                     'street': {'type': str, 'minlength': 5},
#                     'city': {'type': str, 'minlength': 3},
#                 }
#             }
#         }
#     }
# }

