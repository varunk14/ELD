"""Custom exception handling for the API."""
from rest_framework.views import exception_handler
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats errors consistently.
    
    Format:
    {
        "error": "Human-readable error message",
        "code": "ERROR_CODE",
        "details": {}  # optional, for validation errors
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Build custom error response
        custom_response = {
            'error': get_error_message(exc, response),
            'code': get_error_code(exc, response),
        }

        # Add details for validation errors
        if hasattr(exc, 'detail') and isinstance(exc.detail, dict):
            custom_response['details'] = exc.detail
        
        response.data = custom_response

    return response


def get_error_message(exc, response):
    """Get a human-readable error message from the exception."""
    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return 'Authentication required'
    
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, str):
            return exc.detail
        elif isinstance(exc.detail, dict):
            # Get the first error message
            for key, value in exc.detail.items():
                if isinstance(value, list) and len(value) > 0:
                    return f"{key}: {value[0]}"
                return str(value)
        elif isinstance(exc.detail, list) and len(exc.detail) > 0:
            return str(exc.detail[0])
    
    return 'An error occurred'


def get_error_code(exc, response):
    """Get the error code based on status code and exception type."""
    status_code = response.status_code
    
    code_map = {
        400: 'VALIDATION_ERROR',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_ALLOWED',
        429: 'RATE_LIMITED',
        500: 'SERVER_ERROR',
    }
    
    return code_map.get(status_code, 'ERROR')
