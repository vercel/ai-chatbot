import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from flask import current_app
from extensions.openai import generate_ai_text
from extensions.google_cloud import run_prediction_bert_model
from extensions.clickhouse import query_clickhouse
import json
    
def rule_base_adjust_column_names(
        prompt: str,
        column_names: list, 
    ):

    column_rules = current_app.config.get('COLUMN_RULES')
    prompt_rules = current_app.config.get('PROMPT_RULES')

    prompt = prompt.lower()

    added_columns = set()
    column_names = set(column_names)

    always_add = column_rules['always_add']
    column_rules = column_rules['column_rules']
    prompt_rules = prompt_rules['prompt_rules']


    # add columns that should always be added
    for column in always_add:
        added_columns.add(column)
    
    column_names = column_names.union(added_columns)

    # column-based rule adjustments
    for column_name in column_names:
        for rule in column_rules:
            if column_name in rule['match']:
                for add in rule['add']:
                    if add not in column_names:
                        added_columns.add(add)

    column_names = column_names.union(added_columns)

    for rule in prompt_rules:
        for match_key in rule['match']:
            if match_key in prompt:
                for add in rule['add']:
                    if add not in column_names:
                        column_names.add(add)
                        added_columns.add(add)

    return column_names, added_columns

def find_player_id_in_lookup_table(
    player_name: str, 
    player_position: str = None,
):
    vectorizer = TfidfVectorizer()
    roster = query_clickhouse('SELECT * FROM core.roster', as_df=True)

    if player_position:
        roster = roster[roster['position'] == player_position]

    tfidf_matrix = vectorizer.fit_transform(roster['player_name'].tolist() + [player_name])
    cosine_similarities = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1]).flatten()
    # Find the best match
    best_match_index = cosine_similarities.argmax()
    best_match_cosine_similarity = cosine_similarities[best_match_index]
    best_match_score = cosine_similarities[best_match_index]

    best_match_row = roster.iloc[best_match_index]
    best_match_player_id = best_match_row['player_id']
    roster['season'] = roster['season'].astype(int)
    max_season = roster.loc[roster['player_id'] == best_match_player_id]['season'].max()

    # Check if the 2023 season exists, otherwise use the max season available
    player_row = roster.loc[
        (roster['player_id'] == best_match_player_id) & 
        (roster['season'] == max_season)
    ]

    # Ensure player_row is a single row, if it's not, take the first one
    if not player_row.empty:
        player_row = player_row.iloc[0]

    # this returns a dictionary with the player row, and cosine similarity score
    return {
        'player_row': player_row,
        'cosine_similarity': best_match_score
    }


def find_all_player_ids(
    identified_players: list, 
    prompt: str = None
) -> tuple:
    for i, player in enumerate(identified_players):
        best_match = find_player_id_in_lookup_table(
            player_name=player['player_name'], 
            player_position=player['player_position']
        )
        identified_players[i]['player_position'] = best_match['player_row']['position']
        identified_players[i]['player_id'] = best_match['player_row']['player_id']
        identified_players[i]['cosine_similarity'] = best_match['cosine_similarity']
        identified_players[i]['player_info'] = best_match['player_row'].to_dict()
        # add the player position to the query based on the end location of the player name
        end = prompt.find(player['player_name']) + len(player['player_name'])

        if prompt:
            insertion_index = end
            while insertion_index < len(prompt) and prompt[insertion_index].isalnum():
                insertion_index += 1

            # Add the player position at the found index
            player_position = best_match['player_row']['position']
            prompt = prompt[:insertion_index] + f' ({player_position})' + prompt[insertion_index:]

    return identified_players, prompt

def predict_columns(
    prompt: str, 
    prediction_threshold: float = 0.5
):

    endpoint_name = current_app.config.get('VERTEX_ENDPOINT')
    stoi = current_app.config.get('STOI')
    column_descriptions = current_app.config.get('COLUMN_DESCRIPTIONS')
    
    predictions = run_prediction_bert_model(prompt)
    logits = np.array([(1/(1+np.exp(-p))) for p in predictions])
    predictions = logits > prediction_threshold

    predicted_columns = set(stoi[predictions == 1])

    all_columns, added_columns = rule_base_adjust_column_names(
        prompt=prompt,
        column_names=predicted_columns
    )

    column_descriptions = column_descriptions.loc[column_descriptions['column'].isin(all_columns), :]

    all_columns = column_descriptions['column'].values.tolist()
    str_column_descriptions = column_descriptions['description'].values.tolist()

    return all_columns, added_columns, str_column_descriptions

def generate_sql_query(
        prompt:str,
        player_names_and_ids:list=None,
        columns_and_descriptions:list=None,
        error:bool=False,
        error_message=None,
        model_name:str = 'gpt-4o',
    ):

    user_prompt = prompt

    if error:
        user_prompt += f"\n\ On a previous try for this same question, you got this error: {error_message}"

    player_names_and_ids = '\n '.join([f"{player[0]}: {player[1]}" for player in player_names_and_ids])

    columns_and_descriptions = '\n '.join([f"{column[0]}: {column[1]}" for column in columns_and_descriptions])

    system_prompt = f"""
    You are an expert in the nflfastR database, you can create SQL queries based on a user's question related to the schema in the nflfastR database. 
    When producing queries, please do not add any additional information to the response. 
    Your response will be fed to a database that will process the query.

    Here is some information that will allow you to construct a query:

    Table Name: core.play_by_play

    Columns that might be relevant:\n {columns_and_descriptions}
    
    Identified Players:\n {player_names_and_ids}

    You should only use player_ids to filter the data based on the identified players, except in the case where a player_id is not available.

    The database this SQL query will be executed against will represent NFL play by play data.
    
    Data will need to aggregated (summed, averaged, etc.) across plays, weeks or seasons as each row record represents a single play.
    
    Where a season is not specified, the season should default to the 2023 season.
    
    When a season type is not specified (post or regular), the query should default to regular season data.
    """

    sql_query = generate_ai_text(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model=model_name,
        temperature=0.3,
        stream=False,
        json_response=False
    )

    if '```sql' in sql_query:
        sql_query = sql_query.split('```sql')[1].split('```')[0].strip()

    return sql_query

def generate_sql_summary(
        prompt: str,
        sql_query: str,
        sql_result: str,
        model_name: str='gpt-4o',
    ):  

    system_prompt = f"""
    You are a helpful assistant processing the results of an SQL query from the nflfastR database. 
    The user asked a previous question and you need to provide a response based on the results of the query.
    Please provide the answer in a very helpful format for the user. Please, as much as possible, obfuscate 
    that you are a machine querying an SQL database and provide the answer in a human-like manner. Do not
    mention player IDs or any other database-specific information.

    Return the answer to the user's question in JSON format.
    The JSON should be formatted as an object with the key "human-response" as the human readable response, and the key "answer" as the actual answer to the user's question in a string format

    Please be as helpful and verbose as possible in your human-readable response, and as concise as possible in your answer response.   
    """

    user_prompt = f"""
    Please tell me the answer to {prompt}.
    SQL query: {sql_query}
    Result: {sql_result}
    """

    message = generate_ai_text(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model=model_name,
        temperature=0.5,
        stream=False,
        json_response=True
    )

    return message