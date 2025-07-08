import logging
import requests
from typing import Optional, Dict, Any, Union


#configuracion
from utils.config import HTTPS_SERVICE_ROOM

logger = logging.getLogger()
logger.setLevel(logging.INFO)

class ExternalAPIClient:
    def __init__(
        self,
        base_url: str,
        default_headers: Optional[Dict[str, str]] = None,
        timeout: int = 5,
    ):
        self.base_url = base_url.rstrip('/')
        self.default_headers = default_headers or {}
        self.timeout = timeout

    def request(
        self,
        endpoint: str,
        method: str = "GET",
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Union[Dict[str, Any], list]] = None,
        data: Optional[Union[Dict[str, Any], str]] = None,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        all_headers = {**self.default_headers, **(headers or {})}


        logger.info(f"Llamando {method} a {url} con params={params} y headers={all_headers}")

        try:
            response = requests.request(
                method=method.upper(),
                url=url,
                headers=all_headers,
                params=params,
                json=json,
                data=data,
                timeout=self.timeout
            )
            response.raise_for_status()
            try:
                return response.json()

            except ValueError:
                logger.warning("Respuesta no es JSON, devolviendo texto plano")
                return {"raw_response": response.text}

        except requests.exceptions.Timeout:
            logger.error(f"Timeout al llamar a {url}")
            raise
        except requests.exceptions.HTTPError as e:
            logger.error(f"Error HTTP: {e} - Response: {e.response.text if e.response else 'sin respuesta'}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Error en petición: {e}")
            raise


def create_external_api_client_room():
    return ExternalAPIClient(base_url=HTTPS_SERVICE_ROOM)
