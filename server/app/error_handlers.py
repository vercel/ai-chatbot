from flask import jsonify

def handle_internal_server_error(e):
    response = jsonify({
        'error': 'Internal Server Error',
        'message': str(e)  # You can omit this in production to avoid leaking error details
    })
    response.status_code = 500
    return response