import os
from flask import current_app, g
from google.cloud import datastore, aiplatform

class GoogleCloud:
    def __init__(self, app=None):
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        app.config.setdefault('GCP_PROJECT', 'main-414219')
        app.config.setdefault('VERTEX_AI_REGION', 'us-central1')
        app.config.setdefault('VERTEX_ENDPOINT', 'projects/239130517355/locations/us-central1/endpoints/849919629540615782')
        app.config.setdefault('GCP_DATASTORE_DATABASE', 'huddlechat-eval')

        app.teardown_appcontext(self.teardown)
        app.extensions['google_cloud'] = self

        @app.before_request
        def add_gcs_client():
            if not hasattr(current_app, 'datastore_client'):
                current_app.datastore_client = self._get_datastore_client()
            if not hasattr(current_app, 'vertex_ai_client'):
                current_app.vertex_ai_client = self._get_vertex_ai_client()

        with app.app_context():
            self._perform_initial_setup(app)

    def teardown(self, exception):
        datastore_client = g.pop('datastore_client', None)
        vertex_ai_client = g.pop('vertex_ai_client', None)
        if datastore_client is not None or vertex_ai_client is not None:
            pass

    def _get_datastore_client(self):
        if 'datastore_client' not in g:
            g.datastore_client = datastore.Client(
                project=current_app.config['GCP_PROJECT'],
                database=current_app.config['GCP_DATASTORE_DATABASE']
            )
        return g.datastore_client

    def _get_vertex_ai_client(self):
        if 'vertex_ai_client' not in g:
            aiplatform.init(
                project=current_app.config['GCP_PROJECT'],
                location=current_app.config['VERTEX_AI_REGION']
            )
            g.vertex_ai_client = aiplatform
        return g.vertex_ai_client

    def _perform_initial_setup(self, app):
        pass

    @property
    def datastore_client(self):
        return self._get_datastore_client()

    @property
    def vertex_ai_client(self):
        return self._get_vertex_ai_client()

def add_entity_to_datastore(data, kind='prediction'):
    
    if not hasattr(current_app, 'datastore_client'):
        raise RuntimeError('Datastore client not initialized')

    client = current_app.datastore_client
    key = client.key('prediction')
    entity = datastore.Entity(key=key)
    entity.update(data)
    client.put(entity)

    return entity

def run_prediction_bert_model(prompt):

    if not hasattr(current_app, 'vertex_ai_client'):
        raise RuntimeError('Vertex AI client not initialized')

    client = current_app.vertex_ai_client
    endpoint = aiplatform.Endpoint(endpoint_name=current_app.config.get('VERTEX_ENDPOINT'))
    prediction = endpoint.predict(instances=[{
        "prompt": prompt
    }]).predictions[0][0]

    return prediction