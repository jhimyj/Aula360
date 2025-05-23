import logging
import jwt
import datetime
from typing import Optional
from utils.config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_TIME

logger = logging.getLogger()
logger.setLevel(logging.INFO)
class Token:
    def __init__(self, secret_key: str, algorithm: str = "HS256", expiration_time: int = 3600):
        """
        Inicializa la clase Token.
        :param secret_key: La clave secreta para firmar los tokens.
        :param algorithm: El algoritmo de firma (por defecto es 'HS256').
        :param expiration_time: El tiempo de expiración del token en segundos (por defecto es 1 hora).
        """
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.expiration_time = expiration_time

    def generate_token(self, payload: dict) -> str:
        """
        Genera un JWT con el payload proporcionado.
        :param payload: El payload que se incluirá en el token (ejemplo: {"user_id": 123}).
        :return: El JWT generado.
        """
        expiration = datetime.datetime.utcnow() + datetime.timedelta(seconds=self.expiration_time)
        payload["exp"] = expiration  # Añadir el tiempo de expiración al payload
        print(payload)
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def decode_token(self, token: str) -> Optional[dict]:
        """
        Decodifica un token JWT.
        Si el token es válido y no ha expirado, devuelve el payload; si no, devuelve None.
        :param token: El token que se desea decodificar.
        :return: El payload decodificado o None si el token es inválido o ha expirado.
        """
        try:
            decoded = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return decoded
        except jwt.ExpiredSignatureError:
            logger.error("El token ha expirado.")
            raise ValueError("Token expired")
        except jwt.InvalidTokenError:
            logger.error("Token inválido.")
            raise ValueError("Token invalid")

    def validate_token(self, token: str) -> bool:
        """
        Valida si el token es válido y no ha expirado.
        :param token: El token que se desea validar.
        :return: True si el token es válido, False si es inválido o ha expirado.
        """
        decoded = self.decode_token(token)
        return decoded is not None

    @staticmethod
    def remove_bearer_prefix(token: str) -> str:
        """
        Removes the "Bearer " prefix from a token.
        :param token: The token with the "Bearer " prefix.
        :return: The token without the "Bearer " prefix.
        """
        if token.startswith("Bearer "):
            return token[7:]
        return token


def get_token_instance():
    return Token(JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_TIME)