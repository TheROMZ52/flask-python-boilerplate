from app import create_app


def test_vercel_uses_writable_instance_path(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "SQLALCHEMY_ENGINE_OPTIONS": {},
        }
    )

    assert app.instance_path == "/tmp/nexvordev-instance"
