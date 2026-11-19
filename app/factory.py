import os

from flask import Flask

from app.api import api_bp
from app.errors import register_error_handlers
from app.extensions import db, migrate
from app.web import web_bp
from endpoints import api_bp as legacy_api_bp


def create_app(test_config: dict | None = None) -> Flask:
    flask_options = {}
    if os.getenv("VERCEL") == "1":
        flask_options["instance_path"] = os.getenv("INSTANCE_PATH", "/tmp/nexvordev-instance")

    app = Flask(__name__, **flask_options)
    app.config.from_object("app.core.config.Config")

    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(api_bp)
    app.register_blueprint(legacy_api_bp, name="legacy_api")
    app.register_blueprint(web_bp)
    register_error_handlers(app)

    return app
