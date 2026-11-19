from flask import Flask

from app.errors import register_error_handlers
from app.extensions import db, migrate
from app.web import web_bp
from endpoints import api_bp


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    migrate.init_app(app, db)

    from app import models

    app.register_blueprint(web_bp)
    app.register_blueprint(api_bp)
    register_error_handlers(app)

    return app
