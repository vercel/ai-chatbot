import clickhouse_connect
import pandas as pd
import json
from flask import current_app, g

class ClickHouse:
    def __init__(self, app=None):
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        app.config.setdefault('CLICKHOUSE_HOST', 'localhost')
        app.config.setdefault('CLICKHOUSE_PORT', 8123)
        app.config.setdefault('CLICKHOUSE_USER', '')
        app.config.setdefault('CLICKHOUSE_PASSWORD', '')
        app.config.setdefault('CLICKHOUSE_SECURE', True)
        
        app.teardown_appcontext(self.teardown)
        app.extensions['clickhouse'] = self

        @app.before_request
        def add_clickhouse_client():
            if not hasattr(current_app, 'clickhouse_client'):
                current_app.clickhouse_client = self._get_clickhouse_client()

        with app.app_context():
            self._perform_initial_queries(app)

    def teardown(self, exception):
        client = g.pop('clickhouse_client', None)
        if client is not None:
            pass

    def _get_clickhouse_client(self):
        if 'clickhouse_client' not in g:
            g.clickhouse_client = clickhouse_connect.get_client(
                host=current_app.config['CLICKHOUSE_HOST'],
                port=current_app.config['CLICKHOUSE_PORT'],
                user=current_app.config['CLICKHOUSE_USER'],
                password=current_app.config['CLICKHOUSE_PASSWORD'],
                secure=current_app.config['CLICKHOUSE_SECURE']
            )
        return g.clickhouse_client

    def _perform_initial_queries(self, app):
        client = self._get_clickhouse_client()

        column_descriptions_query = "SELECT * FROM core.play_by_play_column_descriptions"
        res = client.query(column_descriptions_query)
        app.config['COLUMN_DESCRIPTIONS'] = pd.DataFrame(res.result_rows, columns=['column', 'description'])

    @property
    def client(self):
        return self._get_clickhouse_client()

def query_clickhouse(
        sql_query: str,
        as_df: bool = False
    ):

    if not hasattr(current_app, 'clickhouse_client'):
        raise RuntimeError('ClickHouse client not initialized')

    client = current_app.clickhouse_client
    res = client.query_df(sql_query)

    if as_df:
        return res

    return json.loads(res.to_json())


