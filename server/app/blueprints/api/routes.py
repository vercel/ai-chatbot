from datetime import datetime
from typing import List, Optional, Dict, Any
from flask import request, jsonify, current_app
from app.blueprints.api import bp as app
from clickhouse_connect.driver.exceptions import DatabaseError
from extensions.clickhouse import query_clickhouse
from extensions.google_cloud import add_entity_to_datastore

from app.blueprints.api.models import (
    PlayerModel, RequestModel, NERResultsModel, ResponseModel
)
from app.nlp.functions import (
    generate_sql_query, generate_sql_summary,
    find_all_player_ids, predict_columns
)

@app.route('/query-database', methods=['POST'])
def query_database():

    try:
        content = request.json
        RequestModel(**content)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    prompt = content['prompt']
    players = content['players']
    teams = content['teams']

    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400


    updated_players, updated_prompt = find_all_player_ids(
        prompt=prompt,
        identified_players=players
    )

    all_columns, added_columns, column_descriptions = predict_columns(
        prompt=updated_prompt,
        prediction_threshold=0.3,
    )

    predicted_columns = list(set(all_columns) - set(added_columns))

    columns_and_descriptions = [(col, desc) for col, desc in zip(all_columns, column_descriptions)]
    player_names_and_ids = [(player['player_name'], player['player_id']) for player in updated_players]

    sql_query = generate_sql_query(
        model_name='gpt-4o',
        prompt=updated_prompt,
        columns_and_descriptions=columns_and_descriptions,
        player_names_and_ids=player_names_and_ids, 
        error=False
    )

    max_retries = 3
    tries = 0
    sql_resolved = False

    while tries < max_retries:
        try:
            sql_result = query_clickhouse(sql_query)
            sql_resolved = True
            break
        except DatabaseError as e:
            tries += 1
            sql_query = generate_sql_query(
                model_name='gpt-4o',
                prompt=updated_prompt,
                columns_and_descriptions=columns_and_descriptions,
                player_names_and_ids=player_names_and_ids,
                error=True,
                error_message=str(e)
            )

    if not sql_resolved:
        data = ResponseModel(
            original_prompt=prompt,
            updated_prompt=updated_prompt,
            predicted_columns=predicted_columns,
            rule_based_adjustment=added_columns,
            ner_results=NERResultsModel(
                identified_players=updated_players,
                identified_teams=teams
            ),
            sql_query=sql_query,
            query_results=None,
            query_summary=None,
            query_answer=None,
            utctime=datetime.utcnow().isoformat(),
            success=False
        )
        add_entity_to_datastore(data.dict(), kind='prediction')
        return jsonify({'error': 'Query could not be resolved'}), 500

    summary_results = generate_sql_summary(
        model_name='gpt-4o',
        prompt=updated_prompt,
        sql_query=sql_query,
        sql_result=sql_result
    )

    query_summary = summary_results['human-response']
    query_answer = summary_results['answer']

    try:
        data = ResponseModel(
            original_prompt=prompt,
            updated_prompt=updated_prompt,
            predicted_columns=predicted_columns,
            rule_based_adjustment=added_columns,
            ner_results=NERResultsModel(
                identified_players=updated_players,
                identified_teams=teams
            ),
            sql_query=sql_query,
            query_results=sql_result,
            query_summary=query_summary,
            query_answer=query_answer,
            utctime=datetime.utcnow().isoformat(), 
            success=True
        )
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    try:
        add_entity_to_datastore(data.dict(), kind='prediction')
    except Exception as e:
        pass

    return jsonify(data.model_dump()), 200

    