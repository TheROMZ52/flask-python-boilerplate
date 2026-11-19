def test_database_health_check(client):
    response = client.get("/api/db/health")

    assert response.status_code == 200
    assert response.json == {"status": "ok", "database": "connected"}


def test_create_and_list_items(client):
    created = client.post("/api/v1/items", json={"name": "Database item", "value": 42})

    assert created.status_code == 201
    assert created.json["item"]["name"] == "Database item"

    listed = client.get("/api/v1/items")
    assert listed.status_code == 200
    assert listed.json["total"] == 1
    assert listed.json["data"][0]["value"] == 42


def test_get_update_and_delete_item(client):
    created = client.post("/api/v1/items", json={"name": "Before", "value": 1})
    item_id = created.json["item"]["id"]

    fetched = client.get(f"/api/v1/items/{item_id}")
    assert fetched.status_code == 200

    updated = client.patch(f"/api/v1/items/{item_id}", json={"name": "After", "value": 2})
    assert updated.status_code == 200
    assert updated.json["item"]["name"] == "After"
    assert updated.json["item"]["value"] == 2

    deleted = client.delete(f"/api/v1/items/{item_id}")
    assert deleted.status_code == 204

    missing = client.get(f"/api/v1/items/{item_id}")
    assert missing.status_code == 404


def test_item_validation(client):
    response = client.post("/api/v1/items", json={"name": " ", "value": "wrong"})

    assert response.status_code == 400
    assert response.json["error"]["name"] == "Validation Error"


def test_item_not_found(client):
    response = client.get("/api/v1/items/999")

    assert response.status_code == 404
    assert response.json["error"]["name"] == "Not Found"
