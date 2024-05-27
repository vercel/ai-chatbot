from flask import Flask, request, jsonify
import torch
from openai import Client
import requests
import json
import numpy as np
import pandas as pd
import clickhouse_connect
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
client = Client(api_key=os.getenv('OPENAI_API_KEY'))
TORCHSERVER_URL = 'http://localhost:8080/predictions/bert_classifier'
HUGGING_FACE_TOKEN = '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'
NER_ENDPOINT = 'https://api-inference.huggingface.co/models/dslim/bert-base-NER'
CLICKHOUSE_PASSWORD=os.getenv('CLICKHOUSE_PASSWORD')
CLICKHOUSE_HOSTNAME=os.getenv('CLICKHOUSE_HOSTNAME')
CLICKHOUSE_USERNAME=os.getenv('CLICKHOUSE_USERNAME')
CLICKHOUSE_PORT=os.getenv('CLICKHOUSE_PORT')

clickhouse_client = clickhouse_connect.get_client(
    host=CLICKHOUSE_HOSTNAME,
    port=CLICKHOUSE_PORT,
    user=CLICKHOUSE_USERNAME,
    password=CLICKHOUSE_PASSWORD,
    secure=True
)

query = f"SELECT player_name, position, player_id from core.roster"
res = clickhouse_client.query(query)
roster = pd.DataFrame(res.result_rows, columns=['player_name', 'position', 'player_id'])
roster = roster.drop_duplicates(subset='player_id', keep='first')
vectorizer = TfidfVectorizer()

with open('train_run_1__stoi.json', 'r') as f:
    stoi = json.load(f)['columns']

stoi = [(k, v) for k, v in stoi.items()]
stoi = sorted(stoi, key=lambda x: x[1])
stoi = np.array([x[0] for x in stoi])

def merge_entities(entities):
    if not entities:
        return []

    merged_entities = []
    current_entity = entities[0]

    for entity in entities[1:]:
        if entity['entity_group'] == current_entity['entity_group'] and entity['start'] == current_entity['end']:
            # Merge entities
            current_entity['end'] = entity['end']
            current_entity['word'] += entity['word'].replace('##', '')
            current_entity['score'] = (current_entity['score'] + entity['score']) / 2  # average score for simplicity
        else:
            # Append the current entity and start a new one
            merged_entities.append(current_entity)
            current_entity = entity

    # Append the last entity
    merged_entities.append(current_entity)

    return merged_entities

def query_ner(payload):
    API_URL = NER_ENDPOINT
    headers = {"Authorization": f"Bearer {HUGGING_FACE_TOKEN}"}
    response = requests.post(API_URL, headers=headers, json=payload)
    entities = merge_entities(response.json())
    identified_players_teams = {
        'identified_players': [{
            'name': entity['word'],
            'ner_score': entity['score'],
            'start': entity['start'],
            'end': entity['end'],
        } for entity in entities if entity['entity_group'] == 'PER'],
        'identified_teams': [
            {
                'name': entity['word'],
                'ner_score': entity['score'],
                'start': entity['start'],
                'end': entity['end'],
            } for entity in entities if entity['entity_group'] == 'ORG'
        ]
    }
    return identified_players_teams
	
def rule_base_adjustment(prompt: str, columns: set):
    added_columns = set()
    #prompt adjustments
    prompt = prompt.lower()

    if 'passer_player_id' in columns:
        columns.add('passer_player_name')
        added_columns.add('passer_player_name')

    if 'receiver_player_id' in columns:
        columns.add('receiver_player_name')
        added_columns.add('receiver_player_name')

    if 'rusher_player_id' in columns:
        columns.add('rusher_player_name')
        added_columns.add('rusher_player_name')

    columns.add('season')
    added_columns.add('season')

    columns.add('season_type')
    added_columns.add('season_type')

    columns.add('posteam')
    added_columns.add('posteam')

    columns.add('defteam')
    added_columns.add('defteam')

    if 'cover 2' in prompt:
        columns.add('defense_coverage_type')
        added_columns.add('defense_coverage_type')

    if 'cover 3' in prompt:
        columns.add('defense_coverage_type')
        added_columns.add('defense_coverage_type')

    if 'cover 4' in prompt:
        columns.add('defense_coverage_type')
        added_columns.add('defense_coverage_type')

    if 'cover 6' in prompt:
        columns.add('defense_coverage_type')
        added_columns.add('defense_coverage_type')

    if 'air yards' in prompt:
        columns.add('air_yards')
        added_columns.add('air_yards')

    if 'cpoe' in prompt:
        columns.add('cpoe')
        added_columns.add('cpoe')

    if 'epa' in prompt:
        columns.add('epa')
        added_columns.add('epa')

    if 'quarter' in prompt:
        columns.add('qtr')
        added_columns.add('qtr')

    if 'down' in prompt:
        columns.add('down')
        added_columns.add('down')

    return columns, added_columns

def find_player_in_lookup_table(player_name):
    tfidf_matrix = vectorizer.fit_transform(roster['player_name'].tolist() + [player_name])
    cosine_similarities = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()
    # Find the best match
    # get the cosine similarity score of the best match
    best_match_index = cosine_similarities.argmax()
    best_match_cosine_similarity = cosine_similarities[best_match_index]
    best_match_score = cosine_similarities[best_match_index]
    best_match_row = roster.iloc[best_match_index]
    return tuple(best_match_row.values.tolist() + [best_match_cosine_similarity]) 

@app.route('/query-database', methods=['POST'])
def query_database():
    content = request.json
    # Get the prompt from the request
    query = content['prompt']
    ner_results = query_ner({'inputs': query})

    # filter out EPA and CPOE as a team name
    ner_results['identified_teams'] = [team for team in ner_results['identified_teams'] if team['name'].lower() not in ['epa', 'cpoe']]

    # find the player in the look up table
    for i, player in enumerate(ner_results['identified_players']):
        best_match = find_player_in_lookup_table(player['name'])
        ner_results['identified_players'][i]['player_id'] = best_match[2]
        ner_results['identified_players'][i]['player_position'] = best_match[1]
        ner_results['identified_players'][i]['player_id_score'] = best_match[-1]

        # add the player position to the query based on the end location of the NER results
        end = player['end']
        # if there is a space after the player name, add the position after the space
        # else, add it after the next whitespace
        # Find the next space or special character after the end position
        insertion_index = end
        while insertion_index < len(query) and query[insertion_index].isalnum():
            insertion_index += 1

        # Add the player position at the found index
        query = query[:insertion_index] + f' ({best_match[1]})' + query[insertion_index:]

    payload = json.dumps({"prompt": query})
    response = requests.post(TORCHSERVER_URL, data=str(payload))

    # find the relevant columns in the request
    logits = response.json()
    logits = torch.tensor(logits)
    predictions = torch.sigmoid(logits)
    predictions = predictions.ge(0.5).int().squeeze().numpy()
    predicted_columns = set(stoi[predictions == 1])
    all_columns, added_columns = rule_base_adjustment(query, predicted_columns)

    query_descriptions = "SELECT column, description from core.play_by_play_column_descriptions where column in ('" + "','".join(all_columns) + "')"
    res = clickhouse_client.query(query_descriptions)
    all_columns_description = pd.DataFrame(res.result_rows, columns=['column', 'description'])

    data = {
        'columns': [
            {
                'column': column,
                'description': all_columns_description[all_columns_description['column'] == column]['description'].values[0]
            } for column in all_columns
        ],
        'rule_base_adjustment': list(added_columns),
        'ner_results': ner_results
    }

    sql_openai_query = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": f"""
        You are an expert in the nflfastR database, 
        you can create SQL queries based on a user's question related to the schema in the nflfastR database. 
        When producing queries, please do not add any additional information to the response. 
        Your response will be fed to a database that will process the query.

        Here is some information that will allow you to construct a query:

        Table Name: core.play_by_play
        Relevant Columns: {data['columns']}
        
        Identified Players: {[(player['name'], player['player_id']) for player in data['ner_results']['identified_players']]}
        Identified Teams: {[(team['name']) for team in data['ner_results']['identified_teams']]}        

        The database this SQL query will be executed against will represent NFL play by play data.
        Data will need to aggregated (summed, averaged, etc.) across plays, weeks or seasons as each row record represents a single play.
        Where a season is not specified, the season should default to the 2023 season.
        When a season type is not specified (post or regular), the query should default to regular season data.
        """},
        {"role": "user", "content": query},
        ],
        stream=False
    )

    sql_query = sql_openai_query.choices[0].message.content

    if '```sql' in sql_query:
        sql_query = sql_query.split('```sql')[1].split('```')[0].strip()

    data['sql_query'] = sql_query

    # run the query against the database
    res = clickhouse_client.query_df(sql_query).to_json()
    query_result = json.loads(res)
    data['query_results'] = query_result

    print(query)
    query = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": f"""
        You are a helpful assistant processing the results of an SQL query from the nflfastR database. 
        The user asked a previous question and you need to provide a response based on the results of the query.
        Please provide the answer in a very helpful format for the user. Please, as much as possible, obfuscate 
        that you are a machine querying an SQL database and provide the answer in a human-like manner. Do not
        mention player IDs or any other database-specific information.
        """},
        {"role": "user", "content": f"""
        Please tell me the answer to {query}.
        SQL query: {sql_query}
        Result: {query_result}
        """},
        ],
        stream=False
    )

    data['query_summary'] = query.choices[0].message.content

    return jsonify(data)

if __name__ == '__main__':
    app.run(port=4000, debug=True)