from flask import current_app, g
import openai
import json

class OpenAI:
    def __init__(self, app=None):
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        app.config.setdefault('OPENAI_API_KEY', '')
        app.teardown_appcontext(self.teardown)
        app.extensions['openai'] = self

        @app.before_request
        def add_openai_client():
            if not hasattr(current_app, 'openai_client'):
                current_app.openai_client = self._get_openai_client()

    def teardown(self, exception):
        client = g.pop('openai_client', None)
        if client is not None:
            pass

    def _get_openai_client(self):
        if 'openai_client' not in g:
            openai.api_key = current_app.config['OPENAI_API_KEY']
            g.openai_client = openai
        return g.openai_client

    @property
    def client(self):
        return self._get_openai_client()

def generate_ai_text(
        system_prompt:str,
        user_prompt:str,
        model:str = "gpt-4o",
        temperature:float = 0.5,
        stream:bool = False,
        json_response:bool = False,
    ):

    if not hasattr(current_app, 'openai_client'):
        raise RuntimeError('OpenAI client not initialized')

    client = current_app.openai_client

    args = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "stream": stream
    }

    if json_response:
        args['response_format'] = {"type": "json_object"}

    res = client.chat.completions.create(**args)
    message_content = res.choices[0].message.content

    if json_response:
        return json.loads(message_content)
    else:
        return message_content