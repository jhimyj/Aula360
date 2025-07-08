from typing import Any
from decimal import Decimal
from serializers.serializer_interface import SerializerInterface

class DynamoSerializer(SerializerInterface):
    def serialize(self, doc: Any) -> Any:
        """
        Convierte un documento DynamoDB (que puede contener Decimals) a un dict JSON-serializable.

        :param doc: Documento DynamoDB (dict, list, Decimal, etc.)
        :return: dict o valor serializable compatible con JSON.
        """

        if isinstance(doc, list):
            return [self.serialize(item) for item in doc]

        if isinstance(doc, dict):
            return {key: self.serialize(value) for key, value in doc.items()}

        if isinstance(doc, Decimal):
            # Convertir Decimal a int si no tiene parte decimal, sino a float
            return int(doc) if doc % 1 == 0 else float(doc)

        return doc
