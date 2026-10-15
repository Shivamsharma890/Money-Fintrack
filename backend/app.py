from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo.errors import PyMongoError
from config import Config
from database.connection import get_db, close_db, ensure_indexes
from security.routes import security_bp
from payments.routes import payments_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    if not app.config.get("SECRET_KEY") or not app.config.get("JWT_SECRET_KEY"):
        raise RuntimeError(
            "Set FLASK_SECRET_KEY and JWT_SECRET_KEY in your .env file before starting the backend"
        )
    if app.config.get("PAYMENT_MODE") not in {"test", "live"}:
        raise RuntimeError("PAYMENT_MODE must be either test or live")
    CORS(
        app,
        resources={r"/*": {"origins": [app.config["FRONTEND_ORIGIN"]]}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )
    JWTManager(app)
    app.teardown_appcontext(close_db)
    app.register_blueprint(security_bp)
    app.register_blueprint(payments_bp)

    @app.get("/health")
    def health():
        try:
            get_db().command("ping")
            return (
                jsonify(
                    status="ok", service="Money Fintrack API", database="connected"
                ),
                200,
            )
        except PyMongoError:
            app.logger.exception("MongoDB health check failed")
            return (
                jsonify(
                    status="error", service="Money Fintrack API", database="unavailable"
                ),
                503,
            )

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify(error="API route not found"), 404

    @app.errorhandler(500)
    def internal_error(_error):
        app.logger.exception("Unhandled server error")
        return jsonify(error="Internal server error"), 500

    with app.app_context():
        ensure_indexes(get_db())
    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=False)
