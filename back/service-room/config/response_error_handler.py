import logging
from common.response import Response
from common.exceptions.exceptions import (
    ServiceDataValidationError,
    BusinessValidationError,
    NotFoundError,
    APIError,
    ServiceError,
    BadRequestError,
    RepositoryError
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
def handle_exception(err: Exception, request_id: str) -> dict:
    if isinstance(err, BadRequestError):
        logger.warning(f"Bad request: {err} - Request ID: {request_id}")
        return _make_response(400, "BAD_REQUEST", str(err), request_id)

    elif isinstance(err, ServiceDataValidationError):
        logger.error(f"Validation error: {err} - Request ID: {request_id}")
        return _make_response(400, "VALIDATION_ERROR", str(err), request_id)

    elif isinstance(err, BusinessValidationError):
        logger.info(f"Business validation failed: {err} - Request ID: {request_id}")
        return _make_response(422, "BUSINESS_RULE_VIOLATION", str(err), request_id)

    elif isinstance(err, NotFoundError):
        logger.info(f"Not found: {err} - Request ID: {request_id}")
        return _make_response(404, "NOT_FOUND", str(err), request_id)

    elif isinstance(err, RepositoryError):
        logger.error(f"Repository error: {err} - Request ID: {request_id}", exc_info=True)
        return _make_response(500, "REPOSITORY_ERROR", "Error al acceder a los datos.", request_id)
    elif isinstance(err, ServiceError):
        logger.error(f"Service error: {err} - Request ID: {request_id}", exc_info=True)
        return _make_response(422, "SERVICE_ERROR", str(err), request_id)
    else:
        logger.error(f"Unexpected error: {err} - Request ID: {request_id}", exc_info=True)
        return _make_response(500, "SERVER_ERROR", "Error inesperado en el servidor.", request_id)

def _make_response(status_code: int, code: str, message: str, request_id: str) -> dict:
    return Response(
        status_code=status_code,
        body={
            "success": False,
            "code": code,
            "message": message,
            "request_id": request_id,
        },
    ).to_dict()
