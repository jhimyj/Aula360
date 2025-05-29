import datetime
from decimal import Decimal
def serialize_dynamo_to_dict(dynamo_data):
    """
    Convierte los datos devueltos por DynamoDB a tipos estándar de Python.
    """

    if isinstance(dynamo_data, dict):
        if 'S' in dynamo_data:
            return dynamo_data['S']
        elif 'N' in dynamo_data:
            return float(dynamo_data['N']) if '.' in dynamo_data['N'] else int(dynamo_data['N'])
        elif 'BOOL' in dynamo_data:
            return dynamo_data['BOOL']
        elif 'L' in dynamo_data:
            return [serialize_dynamo_to_dict(item) for item in dynamo_data['L']]
        elif 'M' in dynamo_data:
            return serialize_dynamo_to_dict(dynamo_data['M'])
        elif 'B' in dynamo_data:  # si es tipo binario
            return dynamo_data['B']

        return {k: serialize_dynamo_to_dict(v) for k, v in dynamo_data.items()}

    elif isinstance(dynamo_data, list):
        return [serialize_dynamo_to_dict(item) for item in dynamo_data]

    elif isinstance(dynamo_data, bytes):
        return dynamo_data.decode('utf-8')

    return dynamo_data




def _serialize_value(value):
    """Convierte un valor Python individual a un AttributeValue de DynamoDB."""
    if value is None:
        return {'NULL': True}
    if isinstance(value, bool):
        return {'BOOL': value}
    if isinstance(value, (int, float, Decimal)):
        return {'N': str(value)}
    if isinstance(value, str):
        return {'S': value}
    if isinstance(value, (bytes, bytearray)):
        return {'B': value}
    if isinstance(value, datetime.datetime):
        return {'S': value.isoformat()}
    if isinstance(value, list):
        return {'L': [_serialize_value(v) for v in value]}
    if isinstance(value, set):
        # Detecta conjuntos homogéneos
        if all(isinstance(v, str) for v in value):
            return {'SS': list(value)}
        if all(isinstance(v, (int, float, Decimal)) for v in value):
            return {'NS': [str(v) for v in value]}
        if all(isinstance(v, (bytes, bytearray)) for v in value):
            return {'BS': list(value)}
        # Fallback a lista
        return {'L': [_serialize_value(v) for v in value]}
    if isinstance(value, dict):
        # Map anidado
        return {'M': {k: _serialize_value(v) for k, v in value.items()}}
    # Fallback a string
    return {'S': str(value)}

def serialize_to_dynamo(item: dict) -> dict:
    """
    PREPARA el dict raíz para put_item, sin envolverlo en 'M'.
    Cada clave del item se convierte en un AttributeValue.
    """
    if not isinstance(item, dict):
        raise ValueError("serialize_to_dynamo espera un dict en la raíz")
    return {k: _serialize_value(v) for k, v in item.items()}





def to_json_serializable(obj):
    """
    Recursively convierte objetos Decimal en un dict/list a int o float.

    :param obj: dict, list, Decimal, o cualquier valor
    :return: estructura equivalente con Decimal convertido
    """
    if isinstance(obj, dict):
        return {k: to_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_json_serializable(v) for v in obj]
    elif isinstance(obj, Decimal):
        if obj == obj.to_integral_value():
            return int(obj)
        return float(obj)
    return obj
