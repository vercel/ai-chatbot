curl -X POST http://localhost:5000/api/query-database \
-H "Content-Type: application/json" \
-d '{
  "prompt": "What is Brandon Aiyuks EPA per play",
  "players": [
    {
      "player_name": "Brandon Aiyuk",
      "player_position": "WR"
    }], "teams": []
}' >> output.json

curl -X POST http://localhost:5000/api/query-database \
-H "Content-Type: application/json" \
-d '{
  "prompt": "What is the average number of points scored on drives that started at the opponents 42 yard line",
  "players": [], "teams": []
}' >> output.json