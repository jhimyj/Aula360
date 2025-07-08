import logging
import httpx
from typing import Optional, Dict, Any, Union

from utils.config import HTTPS_SERVICE_QUESTION

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class ExternalAPIClient:
    def __init__(
            self,
            base_url: str,
            default_headers: Optional[Dict[str, str]] = None,
            timeout: float = 5.0,
            max_connections: int = 100,
            retries: int = 3
    ):
        self.base_url = base_url.rstrip('/')
        self.default_headers = default_headers or {}
        self.timeout = timeout

        limits = httpx.Limits(
            max_connections=max_connections,
            max_keepalive_connections=20
        )

        self.client = httpx.Client(
            base_url=self.base_url,
            headers=self.default_headers,
            timeout=self.timeout,
            limits=limits,
            transport=httpx.HTTPTransport(retries=retries)
        )

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
            response = self.client.request(
                method=method.upper(),
                url=url,
                headers=all_headers,
                params=params,
                json=json,
                data=data
            )
            response.raise_for_status()

            try:
                return response.json()
            except ValueError:
                logger.warning("Respuesta no es JSON, devolviendo texto plano")
                return {"raw_response": response.text}

        except httpx.TimeoutException:
            logger.error(f"Timeout al llamar a {url}")
            raise
        except httpx.HTTPStatusError as e:
            error_text = e.response.text if e.response else 'sin respuesta'
            logger.error(f"Error HTTP {e.response.status_code}: {error_text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Error en petición: {e}")
            raise

    def close(self):
        self.client.close()


def create_external_api_client_question():
    return ExternalAPIClient(base_url=HTTPS_SERVICE_QUESTION)
