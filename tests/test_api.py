def test_home_page_returns_success(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Flask Starter" in response.data


def test_health_check_returns_ok(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json["status"] == "ok"
    assert response.json["timestamp"].endswith("Z")


def test_sample_data_returns_three_items(client):
    response = client.get("/api/data")

    assert response.status_code == 200
    assert response.json["total"] == 3
    assert len(response.json["data"]) == 3


def test_existing_item_is_returned(client):
    response = client.get("/api/items/2")

    assert response.status_code == 200
    assert response.json["item"]["id"] == 2


def test_unknown_item_returns_json_404(client):
    response = client.get("/api/items/999")

    assert response.status_code == 404
    assert response.json["error"]["name"] == "Not Found"


def test_unknown_route_returns_json_404(client):
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert response.is_json
