import re

from utils.config import (
    schema_create_student,
    schema_login
)

class CustomValidator:
    """
    Clase para validar datos según un esquema definido, soportando validación de tipo, rango y formato.
    """
    def __init__(self, schema: dict):
        self.schema = schema
        self.errors = {}

    def validate(self, data, path='root'):
        self.errors = {}
        return self._validate(data, self.schema, path)

    def _validate(self, data, schema, path='root'):
        # Validación de esquema
        if 'type' not in schema:
            self._add_error(path, f"El esquema está mal definido, debe tener un 'type' o no hay esquema para {type(data).__name__}")
            return False

        # Validación de tipo
        if not isinstance(data, schema['type']):
            self._add_error(path, f"El campo {path} debe ser de tipo {schema['type'].__name__}")

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
            return type_validators[data_type](data, schema, path)

        return not bool(self.errors)

    def _add_error(self, path, message):
        """Añade un mensaje de error al campo"""
        if path not in self.errors:
            self.errors[path] = message

    def _validate_range(self, data, schema, path):
        """Validar rangos para int y float (función común)"""
        self._check_min_max(data, schema, path)
        return not bool(self.errors)

    def _check_min_max(self, data, schema, path):
        """Validar los valores de min y max para cualquier tipo numérico (int, float)"""
        if 'min' in schema and data < schema['min']:
            self._add_error(path, f"El campo {path} debe ser mayor o igual a {schema['min']}.")
        if 'max' in schema and data > schema['max']:
            self._add_error(path, f"El campo {path} debe ser menor o igual a {schema['max']}.")

    def _validate_string(self, data, schema, path):
        """Validar cadenas (str)"""
        if 'minlength' in schema and len(data) < schema['minlength']:
            self._add_error(path, f"El campo {path} debe tener al menos {schema['minlength']} caracteres.")
        elif 'maxlength' in schema and len(data) > schema['maxlength']:
            self._add_error(path, f"El campo {path} no debe exceder los {schema['maxlength']} caracteres.")

        if 'regex' in schema:
            regex = schema['regex']
            if isinstance(regex, str):
                regex = re.compile(regex)  # Convertir a patrón
            if not regex.match(data):
                self._add_error(path, f"El campo {path} no coincide con el formato requerido.")

        if 'choices' in schema:
            choices = schema['choices']
            if data not in choices:
                self._add_error(path, f"El campo '{path}' tiene un valor no permitido. Valores válidos: {choices}.")


        return not bool(self.errors)

    def _validate_dict(self, data, schema, path):
        """Validar diccionarios"""
        schema_dict = schema.get('schema', {})
        #verificamos si no es nesesario validar el esquema del diccionario, por defaul true
        if schema.get('validate_schema', True) is False:
            # No validar internamente el dict
            return not bool(self.errors)

        # validar required/optional
        for key, rules in schema_dict.items():
            if rules.get('required', True) and key not in data:
                self._add_error(path, f"Falta campo requerido '{key}'")
        for key, value in data.items():
            if key not in schema_dict:
                self._add_error(f"{path}.{key}", "Campo no definido en esquema")
            else:
                self._validate(value, schema_dict[key], f"{path}.{key}")

        return not bool(self.errors)

    def _validate_list(self, data, schema, path):
        """Validar listas"""
        # Validar longitud de la lista (si tiene restricciones en el esquema)
        list_length = len(data)

        # Validar longitud mínima
        if 'minlength' in schema and list_length < schema['minlength']:
            self._add_error(path, f"El campo {path} debe tener al menos {schema['minlength']} elementos.")
            return False  # Si la longitud no cumple, no es necesario continuar validando los elementos

        # Validar longitud máxima
        elif 'maxlength' in schema and list_length > schema['maxlength']:
            self._add_error(path, f"El campo {path} no debe exceder los {schema['maxlength']} elementos.")
            return False  # Si la longitud no cumple, no es necesario continuar validando los elementos

        # Si la longitud es válida, proceder con la validación de cada elemento
        if 'schema' in schema:
            elements_of_param_field = f"elementos de {path}"
            for item in data:
                self._validate(item, schema['schema'], path=elements_of_param_field)

        return not bool(self.errors)

    def get_errors(self):
        return self.errors





#funciones a exportar
def create_validator_schema_create_student():
    return CustomValidator(schema=schema_create_student)

def create_validator_schema_login():
    return CustomValidator(schema=schema_login)