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


def serialize_to_dynamo(data):
    """Convierte los datos de Python al formato esperado por DynamoDB."""

    if isinstance(data, dict):
        return {k: serialize_to_dynamo(v) for k, v in data.items()}

    elif isinstance(data, list):
        return {'L': [serialize_to_dynamo(item) for item in data]}

    elif isinstance(data, str):
        return {'S': data}

    elif isinstance(data, int):
        return {'N': str(data)}

    elif isinstance(data, float):
        return {'N': str(data)}

    elif isinstance(data, bool):
        return {'BOOL': data}

    elif isinstance(data, bytes):
        return {'B': data}

    else:
        return {'S': str(data)}