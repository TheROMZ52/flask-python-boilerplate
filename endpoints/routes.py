from datetime import datetime, timezone

from flask import Blueprint, jsonify

api_bp = Blueprint("api", __name__)

_ITEMS = [
    {"id": 1, "name": "Sample Item 1", "value": 100},
    {"id": 2, "name": "Sample Item 2", "value": 200},
    {"id": 3, "name": "Sample Item 3", "value": 300},
]


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@api_bp.get("/api/health")
def health_check():
    return jsonify({"status": "ok", "timestamp": utc_timestamp()})


@api_bp.get("/api/data")
def get_sample_data():
    return jsonify(
        {
            "data": _ITEMS,
            "total": len(_ITEMS),
            "timestamp": utc_timestamp(),
        }
    )


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
