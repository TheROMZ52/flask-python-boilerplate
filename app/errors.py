from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException):
        return jsonify(
            {
                "error": {
                    "code": error.code,
                    "name": error.name,
                    "message": error.description,
                }
            }
        ), error.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        app.logger.exception("Unhandled application error")
        return jsonify(
            {
                "error": {
                    "code": 500,
                    "name": "Internal Server Error",
                    "message": "An unexpected error occurred.",
                }
            }
        ), 500
