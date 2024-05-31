from flask import Flask
from flask_cors import CORS
from flask import jsonify
from config import Config
from extensions.openai import OpenAI
from extensions.clickhouse import ClickHouse
from extensions.google_cloud import GoogleCloud
from app.error_handlers import handle_internal_server_error

cors = CORS()
openai = OpenAI()
clickhouse = ClickHouse()
google_cloud = GoogleCloud()

def create_app():

    app = Flask(__name__)
    app.config.from_object(Config)

    cors.init_app(app)
    openai.init_app(app)
    clickhouse.init_app(app)
    google_cloud.init_app(app)

    from app.blueprints.api import bp as api_bp

    api_bp.register_error_handler(500, handle_internal_server_error)
    app.register_blueprint(api_bp, url_prefix='/api')

    return app