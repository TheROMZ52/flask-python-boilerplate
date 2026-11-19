from flask import Blueprint

from app.api.v1.health import health_bp

v1_bp = Blueprint("v1", __name__, url_prefix="/v1")
v1_bp.register_blueprint(health_bp)
