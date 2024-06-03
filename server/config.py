import clickhouse_connect
import json
import numpy as np
import openai
import os
import pandas as pd
from dotenv import load_dotenv, find_dotenv

class Config:

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    ENV_PATH = os.path.join(BASE_DIR, '.env')
    
    load_dotenv(ENV_PATH)

    RULES_PATH = os.path.join(BASE_DIR, 'app/nlp/mappings/rules')
    STOI_PATH = os.path.join(BASE_DIR, 'app/nlp/mappings/trained_stoi') 
    PROMPT_RULES_PATH = os.path.join(RULES_PATH, 'prompt_rules.json')
    COLUMN_RULES_PATH = os.path.join(RULES_PATH, 'column_rules.json')
    NER_RULES_PATH = os.path.join(RULES_PATH, 'ner_rules.json')
    STOI_PATH = os.path.join(STOI_PATH, 'train_run_1__stoi.json')


    with open(PROMPT_RULES_PATH, 'r') as f:
        PROMPT_RULES = json.load(f)

    with open(COLUMN_RULES_PATH, 'r') as f:
        COLUMN_RULES = json.load(f)

    with open(NER_RULES_PATH, 'r') as f:
        NER_RULES = json.load(f)

    with open(STOI_PATH, 'r') as f:
        STOI = json.load(f)['columns']
        STOI = [(k, v) for k, v in STOI.items()]
        STOI = sorted(STOI, key=lambda x: x[1])
        STOI = np.array([x[0] for x in STOI])

    TORCHSERVE_URL = os.getenv('TORCHSERVE_URL')
    
    CLICKHOUSE_PASSWORD = os.getenv('CLICKHOUSE_PASSWORD')
    CLICKHOUSE_USER = os.getenv('CLICKHOUSE_USER')
    CLICKHOUSE_DB = os.getenv('CLICKHOUSE_DB')
    CLICKHOUSE_HOST = os.getenv('CLICKHOUSE_HOST')
    CLICKHOUSE_PORT = os.getenv('CLICKHOUSE_PORT')

    HUGGING_FACE_TOKEN = os.getenv('HUGGING_FACE_TOKEN')

    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

    GCP_PROJECT = os.getenv('GCP_PROJECT')
    GCP_DATASTORE_DATABASE = os.getenv('GCP_DATASTORE_DATABASE')
    VERTEX_ENDPOINT = "projects/239130517355/locations/us-central1/endpoints/5599581822821335040"
    VERTEX_AI_REGION = os.getenv('VERTEX_AI_REGION')

