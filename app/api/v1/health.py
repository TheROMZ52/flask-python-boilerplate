from flask import Blueprint, jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db

health_bp = Blueprint("health", __name__)


@health_bp.get("/health/live")
def liveness():
    return jsonify({"status": "ok"})


@health_bp.get("/health/ready")
def readiness():
    try:
        db.session.execute(text("SELECT 1"))
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"status": "error", "checks": {"database": "unavailable"}}), 503

    return jsonify({"status": "ok", "checks": {"database": "ok"}})


@health_bp.get("/health")
def health():
    return jsonify({"status": "ok", "service": "api", "version": "v1"})
