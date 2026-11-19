def test_versioned_liveness_endpoint(client):
    response = client.get("/api/v1/health/live")

    assert response.status_code == 200
    assert response.json == {"status": "ok"}


def test_versioned_readiness_endpoint_checks_database(client):
    response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json == {"status": "ok", "checks": {"database": "ok"}}


def test_versioned_health_endpoint(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json["service"] == "api"
    assert response.json["version"] == "v1"
