"""Custom DRF exception handler that enforces a consistent error contract."""

from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    error_data = {
        "error": {
            "code": _get_error_code(exc),
            "message": _get_error_message(exc, response),
            "details": _get_error_details(response),
        }
    }
    response.data = error_data
    return response


def _get_error_code(exc) -> str:
    code = getattr(exc, "default_code", None)
    if code:
        return code
    class_name = type(exc).__name__
    # Convert CamelCase to snake_case
    import re

    return re.sub(r"(?<!^)(?=[A-Z])", "_", class_name).lower()


def _get_error_message(exc, response) -> str:
    if hasattr(exc, "detail"):
        if isinstance(exc.detail, str):
            return exc.detail
        if isinstance(exc.detail, list):
            return exc.detail[0] if exc.detail else "Validation error"
    status = response.status_code
    messages = {
        400: "Bad request",
        401: "Authentication credentials were not provided or are invalid.",
        403: "You do not have permission to perform this action.",
        404: "Not found.",
        405: "Method not allowed.",
        429: "Request was throttled.",
    }
    return messages.get(status, "An error occurred.")


def _get_error_details(response) -> dict:
    raw = response.data
    if isinstance(raw, dict):
        return {k: v if isinstance(v, list) else [str(v)] for k, v in raw.items()}
    if isinstance(raw, list):
        return {"non_field_errors": [str(item) for item in raw]}
    return {}
