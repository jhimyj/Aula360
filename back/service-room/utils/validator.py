import re
from utils.config import schema_create_room
class CustomValidator:
    """
    Clase para validar datos según un esquema definido, soportando validación de tipo, rango y formato.
    """

    def __init__(self, schema: dict):
        self.schema = schema
        self.errors = {}

    def validate(self, data, param_field='general'):
        self.errors = {}
        return self._validate(data, self.schema, param_field)

    def _validate(self, data, schema, param_field='general'):
        # Validación de esquema
        if 'type' not in schema:
            self._add_error(param_field, f"El esquema está mal definido, debe tener un 'type' o no hay esquema para {type(data).__name__}")
            return False

        # Validación de tipo
        if not isinstance(data, schema['type']):
            self._add_error(param_field, f"El campo {param_field} debe ser de tipo {schema['type'].__name__}")

        # Aplicar validación según el tipo de datos
        type_validators = {
            dict: self._validate_dict,
            list: self._validate_list,
            int: self._validate_range,
            float: self._validate_range,
            str: self._validate_string
        }

        data_type = type(data)
        if data_type in type_validators:
            return type_validators[data_type](data, schema, param_field)

        return not bool(self.errors)

    def _add_error(self, param_field, message):
        """Añade un mensaje de error al campo"""
        if param_field not in self.errors:
            self.errors[param_field] = message

    def _validate_range(self, data, schema, param_field):
        """Validar rangos para int y float (función común)"""
        self._check_min_max(data, schema, param_field)
        return not bool(self.errors)

    def _check_min_max(self, data, schema, param_field):
        """Validar los valores de min y max para cualquier tipo numérico (int, float)"""
        if 'min' in schema and data < schema['min']:
            self._add_error(param_field, f"El campo {param_field} debe ser mayor o igual a {schema['min']}.")
        if 'max' in schema and data > schema['max']:
            self._add_error(param_field, f"El campo {param_field} debe ser menor o igual a {schema['max']}.")

    def _validate_string(self, data, schema, param_field):
        """Validar cadenas (str)"""
        if 'minlength' in schema and len(data) < schema['minlength']:
            self._add_error(param_field, f"El campo {param_field} debe tener al menos {schema['minlength']} caracteres.")
        elif 'maxlength' in schema and len(data) > schema['maxlength']:
            self._add_error(param_field, f"El campo {param_field} no debe exceder los {schema['maxlength']} caracteres.")

        if 'regex' in schema:
            regex = schema['regex']
            if isinstance(regex, str):
                regex = re.compile(regex)  # Convertir a patrón
            if not regex.match(data):
                self._add_error(param_field, f"El campo {param_field} no coincide con el formato requerido.")

        return not bool(self.errors)

    def _validate_dict(self, data, schema, param_field):
        """Validar diccionarios"""
        schema_dict = schema.get('schema', {})
        schema_keys_required = set(schema_dict.keys())
        data_keys = set(data.keys())

        # Compara las claves de schema y data
        missing_keys = schema_keys_required - data_keys
        if missing_keys:
            self._add_error(param_field, f"{param_field} no tiene los campos requeridos {missing_keys}.")
            return False

        for field, value in data.items():
            if field not in schema_keys_required:
                if field not in self.errors:  # Evitar sobrescribir un error ya registrado
                    self._add_error(field, f"Campo {field} no está definido en el esquema.")
                continue

            # Validamos el campo con las reglas del esquema
            rules = schema_dict.get(field)
            self._validate(value, rules, param_field=field)

        return not bool(self.errors)

    def _validate_list(self, data, schema, param_field):
        """Validar listas"""
        # Validar longitud de la lista (si tiene restricciones en el esquema)
        list_length = len(data)

        # Validar longitud mínima
        if 'minlength' in schema and list_length < schema['minlength']:
            self._add_error(param_field, f"El campo {param_field} debe tener al menos {schema['minlength']} elementos.")
            return False  # Si la longitud no cumple, no es necesario continuar validando los elementos

        # Validar longitud máxima
        elif 'maxlength' in schema and list_length > schema['maxlength']:
            self._add_error(param_field, f"El campo {param_field} no debe exceder los {schema['maxlength']} elementos.")
            return False  # Si la longitud no cumple, no es necesario continuar validando los elementos

        # Si la longitud es válida, proceder con la validación de cada elemento
        if 'schema' in schema:
            elements_of_param_field = f"elementos de {param_field}"
            for item in data:
                self._validate(item, schema['schema'], param_field=elements_of_param_field)

        return not bool(self.errors)

    def get_errors(self):
        return self.errors
def get_validator_create_room():
    return CustomValidator(schema_create_room)

