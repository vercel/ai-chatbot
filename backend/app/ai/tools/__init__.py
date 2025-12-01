"""
AI Tools for the chatbot.
Ported from lib/ai/tools/
"""
from app.ai.tools.document import (
    CREATE_DOCUMENT_TOOL_DEFINITION,
    UPDATE_DOCUMENT_TOOL_DEFINITION,
    create_document_tool,
    update_document_tool,
)
from app.ai.tools.suggestions import (
    REQUEST_SUGGESTIONS_TOOL_DEFINITION,
    request_suggestions_tool,
)
from app.ai.tools.weather import GET_WEATHER_TOOL_DEFINITION, get_weather

__all__ = [
    # Weather
    "get_weather",
    "GET_WEATHER_TOOL_DEFINITION",
    # Document
    "create_document_tool",
    "update_document_tool",
    "CREATE_DOCUMENT_TOOL_DEFINITION",
    "UPDATE_DOCUMENT_TOOL_DEFINITION",
    # Suggestions
    "request_suggestions_tool",
    "REQUEST_SUGGESTIONS_TOOL_DEFINITION",
]
