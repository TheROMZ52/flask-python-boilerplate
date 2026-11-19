from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import Item

api_bp = Blueprint("api", __name__)

_ITEMS = [
    {"id": 1, "name": "Sample Item 1", "value": 100},
    {"id": 2, "name": "Sample Item 2", "value": 200},
    {"id": 3, "name": "Sample Item 3", "value": 300},
]


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def validation_error(message: str, status: int = 400):
    return jsonify({"error": {"code": status, "name": "Validation Error", "message": message}}), status


@api_bp.get("/api/health")
def health_check():
    return jsonify({"status": "ok", "timestamp": utc_timestamp()})


@api_bp.get("/api/db/health")
def database_health_check():
    try:
        db.session.execute(text("SELECT 1"))
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({"status": "unavailable", "database": "disconnected"}), 503
    return jsonify({"status": "ok", "database": "connected"})


@api_bp.get("/api/data")
def get_sample_data():
    return jsonify({"data": _ITEMS, "total": len(_ITEMS), "timestamp": utc_timestamp()})


@api_bp.get("/api/items/<int:item_id>")
def get_item(item_id: int):
    item = next((entry for entry in _ITEMS if entry["id"] == item_id), None)
    if item is None:
        return jsonify(
            {
                "error": {
                    "code": 404,
                    "name": "Not Found",
                    "message": f"Item {item_id} was not found.",
                }
            }
        ), 404
    return jsonify({"item": item, "timestamp": utc_timestamp()})


@api_bp.route("/api/v1/items", methods=["GET", "POST"])
def database_items():
    if request.method == "GET":
        items = db.session.execute(db.select(Item).order_by(Item.id)).scalars().all()
        return jsonify({"data": [item.to_dict() for item in items], "total": len(items)})

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return validation_error("A JSON object is required.")

    name = payload.get("name")
    value = payload.get("value", 0)
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 120:
        return validation_error("name must be a non-empty string of at most 120 characters.")
    if isinstance(value, bool) or not isinstance(value, int):
        return validation_error("value must be an integer.")

    item = Item(name=name.strip(), value=value)
    db.session.add(item)
    db.session.commit()
    return jsonify({"item": item.to_dict()}), 201


@api_bp.route("/api/v1/items/<int:item_id>", methods=["GET", "PATCH", "DELETE"])
def database_item(item_id: int):
    item = db.session.get(Item, item_id)
    if item is None:
        return jsonify(
            {"error": {"code": 404, "name": "Not Found", "message": "Item was not found."}}
        ), 404

    if request.method == "GET":
        return jsonify({"item": item.to_dict()})

    if request.method == "DELETE":
        db.session.delete(item)
        db.session.commit()
        return "", 204

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not payload:
        return validation_error("A non-empty JSON object is required.")

    if "name" in payload:
        name = payload["name"]
        if not isinstance(name, str) or not name.strip() or len(name.strip()) > 120:
            return validation_error("name must be a non-empty string of at most 120 characters.")
        item.name = name.strip()

    if "value" in payload:
        value = payload["value"]
        if isinstance(value, bool) or not isinstance(value, int):
            return validation_error("value must be an integer.")
        item.value = value

    db.session.commit()
    return jsonify({"item": item.to_dict()})
