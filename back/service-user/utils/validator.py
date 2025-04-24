import re

class CustomValidator:
    """
    Clase para validar datos según un esquema definido, soportando validación de tipo, rango y formato.
    """

    def __init__(self, schema):
        self.schema = schema
        self.errors = {}

    def validate(self, data):
        self.errors = {}  # Limpiar los errores previos
        return self._validate(data, self.schema)

    def _validate(self, data, schema, param_field='general'):
        if not 'type' in schema:
            self.errors[param_field] = f"El esquema esta mal definido debe tener un type o no hay esquema para {type(data).__name__}"
            return False

        if not isinstance(data, schema['type']):
            self.errors[param_field] = f"El campo {param_field} debe ser de tipo {schema['type'].__name__}"

        if isinstance(data, dict):  # Si los datos son un diccionario
            for field, value in data.items():
                if field not in schema.get('schema', {}):
                    self.errors[field] = f"Campo {field} no está definido en el esquema."
                    continue
                rules = schema['schema'][field]
                self._validate(value, rules, param_field=field)

        elif isinstance(data, list):
            if 'schema' in schema:
                elements_of_param_field= "elementos de " + param_field
                for item in data:
                    self._validate(item, schema['schema'], param_field=elements_of_param_field)

        # Validar rango para int
        if isinstance(data, int):
            if 'min' in schema and data < schema['min']:
                self.errors[param_field] = f"El campo {param_field} debe ser mayor o igual a {schema['min']}."
            if 'max' in schema and data > schema['max']:
                self.errors[param_field] = f"El campo {param_field} debe ser menor o igual a {schema['max']}."

        # Validar rango para float
        if isinstance(data, float):
            if 'min' in schema and data < schema['min']:
                self.errors[param_field] = f"El campo {param_field} debe ser mayor o igual a {schema['min']}."
            if 'max' in schema and data > schema['max']:
                self.errors[param_field] = f"El campo {param_field} debe ser menor o igual a {schema['max']}."

        if isinstance(data, str):
            # Validar longitud mínima y máxima para cadenas
            if 'minlength' in schema and len(data) < schema['minlength']:
                self.errors[param_field] = f"El campo {param_field} debe tener al menos {schema['minlength']} caracteres."
            elif 'maxlength' in schema and isinstance(data, str) and len(data) > schema['maxlength']:
                self.errors[param_field] = f"El campo {param_field} no debe exceder los {schema['maxlength']} caracteres."
            if 'regex' in schema:
                regex = schema['regex']
                if isinstance(regex, str):
                    regex = re.compile(regex)  # Si es un string, lo convertimos a un patrón

                if not regex.match(data):
                    self.errors[param_field] = f"El campo {param_field} no coincide con el formato requerido."

        return not bool(self.errors)

    def get_errors(self):
        return self.errors