"""
Suggestions tool - Request suggestions for a document.
Ported from lib/ai/tools/request-suggestions.ts
"""
import json
import uuid
from typing import Any, Dict, List, Optional

from datetime import datetime

from app.ai.client import get_ai_client, get_model_name
from app.db.queries.document_queries import get_documents_by_id
from app.db.queries.suggestion_queries import save_suggestions
from app.utils.stream import format_sse


async def request_suggestions_tool(
    document_id: str,
    user_id: str,
    db_session: Any,  # AsyncSession
    sse_writer: Optional[Any] = None,  # For emitting SSE events
) -> Dict[str, Any]:
    """
    Request suggestions for a document.

    Args:
        document_id: The ID of the document to request edits
        user_id: User ID for saving suggestions
        db_session: Database session
        sse_writer: Optional SSE event writer (for streaming suggestions to frontend)

    Returns:
        Suggestions result or error
    """
    # Get document from database
    documents = await get_documents_by_id(db_session, uuid.UUID(document_id))
    if not documents:
        return {"error": "Document not found"}

    document = documents[-1]  # Get latest version

    if not document.content:
        return {"error": "Document not found"}

    # Generate suggestions using AI
    suggestions = await _generate_suggestions(document.content, sse_writer)

    # Save suggestions to database
    if suggestions:
        # Prepare suggestions for database
        suggestions_to_save = []
        for sug in suggestions:
            suggestions_to_save.append({
                "id": sug["id"],
                "documentId": document_id,
                "documentCreatedAt": document.created_at,
                "originalText": sug["originalText"],
                "suggestedText": sug["suggestedText"],
                "description": sug.get("description"),
                "isResolved": sug.get("isResolved", False),
                "userId": user_id,
                "createdAt": datetime.utcnow(),
            })

        await save_suggestions(db_session, suggestions_to_save)

    return {
        "id": document_id,
        "title": document.title,
        "kind": document.kind,
        "message": "Suggestions have been added to the document",
    }


async def _generate_suggestions(
    content: str, sse_writer: Optional[Any] = None
) -> List[Dict[str, Any]]:
    """
    Generate suggestions for document content using AI.
    Uses structured output to get suggestions.
    """
    client = get_ai_client()
    model = get_model_name("artifact-model")

    system = "You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions."

    # Use aisuite to generate structured output
    # Note: This is a simplified version. Full structured output support
    # would require using OpenAI's structured output or parsing JSON from response
    messages = [
        {
            "role": "user",
            "content": f"Please provide suggestions for the following text in JSON format as an array of objects with 'originalSentence', 'suggestedSentence', and 'description' fields:\n\n{content}",
        }
    ]

    suggestions = []

    # Stream response and parse suggestions
    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        system=system,
        stream=True,
    )

    full_response = ""
    async for chunk in stream:
        if hasattr(chunk, "choices") and chunk.choices:
            for choice in chunk.choices:
                delta = getattr(choice, "delta", None)
                if delta:
                    text = getattr(delta, "content", None)
                    if text:
                        full_response += text

    # Parse JSON from response
    # Try to extract JSON array from the response
    try:
        # Look for JSON array in the response
        json_start = full_response.find("[")
        json_end = full_response.rfind("]") + 1
        if json_start >= 0 and json_end > json_start:
            json_str = full_response[json_start:json_end]
            parsed_suggestions = json.loads(json_str)

            for suggestion_data in parsed_suggestions:
                suggestion = {
                    "id": str(uuid.uuid4()),
                    "documentId": "",  # Will be set by caller
                    "originalText": suggestion_data.get("originalSentence", ""),
                    "suggestedText": suggestion_data.get("suggestedSentence", ""),
                    "description": suggestion_data.get("description", ""),
                    "isResolved": False,
                }

                suggestions.append(suggestion)

                # Emit SSE event for frontend
                if sse_writer:
                    sse_writer(format_sse({"type": "data-suggestion", "data": suggestion}))
    except (json.JSONDecodeError, KeyError) as e:
        # If parsing fails, return empty suggestions
        print(f"Error parsing suggestions: {e}")
        return []

    return suggestions


# Tool definition for OpenAI format
REQUEST_SUGGESTIONS_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "requestSuggestions",
        "description": "Request suggestions for a document",
        "parameters": {
            "type": "object",
            "properties": {
                "documentId": {
                    "type": "string",
                    "description": "The ID of the document to request edits",
                },
            },
            "required": ["documentId"],
        },
    },
}

