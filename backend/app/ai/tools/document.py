"""
Document tools - Create and update documents.
Ported from lib/ai/tools/create-document.ts and update-document.ts
"""

import uuid
from typing import Any, Dict, Optional

from app.ai.client import get_ai_client, get_model_name
from app.db.queries.document_queries import get_documents_by_id, save_document
from app.utils.helpers import format_sse


async def create_document_tool(
    title: str,
    kind: str,  # "text", "code", "sheet"
    user_id: str,
    db_session: Any,  # AsyncSession
    sse_writer: Optional[Any] = None,  # For emitting SSE events
) -> Dict[str, Any]:
    """
    Create a document for a writing or content creation activity.
    This tool will generate the contents of the document based on the title and kind.

    Args:
        title: Document title
        kind: Document kind ("text", "code", "sheet")
        user_id: User ID for saving the document
        db_session: Database session
        sse_writer: Optional SSE event writer (for streaming updates to frontend)

    Returns:
        Document creation result
    """
    document_id = str(uuid.uuid4())

    # Emit SSE events for frontend
    if sse_writer:
        sse_writer(format_sse({"type": "data-kind", "data": kind}))
        sse_writer(format_sse({"type": "data-id", "data": document_id}))
        sse_writer(format_sse({"type": "data-title", "data": title}))
        sse_writer(format_sse({"type": "data-clear", "data": None}))

    # Generate content based on kind
    content = await _generate_document_content(title, kind, sse_writer)

    # Save document to database
    await save_document(
        db_session,
        document_id=uuid.UUID(document_id),
        title=title,
        kind=kind,
        content=content,
        user_id=uuid.UUID(user_id),
    )

    if sse_writer:
        sse_writer(format_sse({"type": "data-finish", "data": None}))

    return {
        "id": document_id,
        "title": title,
        "kind": kind,
        "content": "A document was created and is now visible to the user.",
    }


async def update_document_tool(
    document_id: str,
    description: str,
    user_id: str,
    db_session: Any,  # AsyncSession
    sse_writer: Optional[Any] = None,  # For emitting SSE events
) -> Dict[str, Any]:
    """
    Update a document with the given description.

    Args:
        document_id: The ID of the document to update
        description: The description of changes that need to be made
        user_id: User ID for validation
        db_session: Database session
        sse_writer: Optional SSE event writer (for streaming updates to frontend)

    Returns:
        Document update result or error
    """
    # Get document from database
    documents = await get_documents_by_id(db_session, uuid.UUID(document_id))
    if not documents:
        return {"error": "Document not found"}

    document = documents[-1]  # Get latest version

    # Validate ownership
    if str(document.user_id) != user_id:
        return {"error": "Unauthorized: You don't own this document"}

    # Emit clear event
    if sse_writer:
        sse_writer(format_sse({"type": "data-clear", "data": None}))

    # Generate updated content
    updated_content = await _generate_updated_content(
        document.content, document.kind, description, sse_writer
    )

    # Save new version
    await save_document(
        db_session,
        document_id=uuid.UUID(document_id),
        title=document.title,
        kind=document.kind,
        content=updated_content,
        user_id=uuid.UUID(user_id),
    )

    if sse_writer:
        sse_writer(format_sse({"type": "data-finish", "data": None}))

    return {
        "id": document_id,
        "title": document.title,
        "kind": document.kind,
        "content": "The document has been updated successfully.",
    }


async def _generate_document_content(
    title: str, kind: str, sse_writer: Optional[Any] = None
) -> str:
    """Generate document content based on title and kind."""
    client = get_ai_client()
    model = get_model_name("artifact-model")

    # System prompts based on kind
    system_prompts = {
        "text": "Write about the given topic. Markdown is supported. Use headings wherever appropriate.",
        "code": """You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops""",
        "sheet": "You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.",
    }

    system = system_prompts.get(kind, system_prompts["text"])

    # For code and sheet, we need structured output
    # For text, we can use regular streaming
    if kind == "text":
        return await _stream_text_content(client, model, system, title, sse_writer, "text")
    elif kind == "code":
        return await _stream_structured_content(
            client, model, system, title, sse_writer, "code", "code"
        )
    elif kind == "sheet":
        return await _stream_structured_content(
            client, model, system, title, sse_writer, "sheet", "csv"
        )
    else:
        return await _stream_text_content(client, model, system, title, sse_writer, "text")


async def _generate_updated_content(
    current_content: Optional[str],
    kind: str,
    description: str,
    sse_writer: Optional[Any] = None,
) -> str:
    """Generate updated document content."""
    client = get_ai_client()
    model = get_model_name("artifact-model")

    # Update prompt
    media_type = "document"
    if kind == "code":
        media_type = "code snippet"
    elif kind == "sheet":
        media_type = "spreadsheet"

    system = f"Improve the following contents of the {media_type} based on the given prompt.\n\n{current_content or ''}"

    if kind == "text":
        return await _stream_text_content(client, model, system, description, sse_writer, "text")
    elif kind == "code":
        return await _stream_structured_content(
            client, model, system, description, sse_writer, "code", "code"
        )
    elif kind == "sheet":
        return await _stream_structured_content(
            client, model, system, description, sse_writer, "sheet", "csv"
        )
    else:
        return await _stream_text_content(client, model, system, description, sse_writer, "text")


async def _stream_text_content(
    client: Any,
    model: str,
    system: str,
    prompt: str,
    sse_writer: Optional[Any],
    delta_type: str,  # "text", "code", "sheet"
) -> str:
    """Stream text content and emit SSE events."""
    content = ""

    # Use aisuite to stream text
    messages = [
        {"role": "system", "content": [{"type": "text", "text": system}]},
        {"role": "user", "content": [{"type": "text", "text": prompt}]},
    ]

    # Stream from aisuite
    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
        store=True,
    )

    for chunk in stream:
        if hasattr(chunk, "choices") and chunk.choices:
            for choice in chunk.choices:
                delta = getattr(choice, "delta", None)
                if delta:
                    text = getattr(delta, "content", None)
                    if text:
                        content += text
                        if sse_writer:
                            # Emit delta based on type
                            if delta_type == "text":
                                sse_writer(format_sse({"type": "data-textDelta", "data": text}))
                            elif delta_type == "code":
                                sse_writer(format_sse({"type": "data-codeDelta", "data": text}))
                            elif delta_type == "sheet":
                                sse_writer(format_sse({"type": "data-sheetDelta", "data": text}))

    return content


async def _stream_structured_content(
    client: Any,
    model: str,
    system: str,
    prompt: str,
    sse_writer: Optional[Any],
    delta_type: str,
    field_name: str,  # "code" or "csv"
) -> str:
    """
    Stream structured content (code or CSV).
    Note: This is a simplified version. Full structured output support
    would require more complex handling with aisuite.
    """
    # For now, use regular streaming and extract the field
    # In a full implementation, we'd use structured output
    content = ""

    messages = [
        {"role": "system", "content": [{"type": "text", "text": system}]},
        {"role": "user", "content": [{"type": "text", "text": prompt}]},
    ]

    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        store=True,
        stream=True,
    )

    for chunk in stream:
        if hasattr(chunk, "choices") and chunk.choices:
            for choice in chunk.choices:
                delta = getattr(choice, "delta", None)
                if delta:
                    text = getattr(delta, "content", None)
                    if text:
                        content += text
                        if sse_writer:
                            if delta_type == "code":
                                sse_writer(format_sse({"type": "data-codeDelta", "data": text}))
                            elif delta_type == "sheet":
                                sse_writer(format_sse({"type": "data-sheetDelta", "data": text}))

    # TODO: Parse structured output if needed
    # For now, return content as-is
    return content


# Tool definitions for OpenAI format
CREATE_DOCUMENT_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "createDocument",
        "description": "Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "The title of the document",
                },
                "kind": {
                    "type": "string",
                    "enum": ["text", "code", "sheet"],
                    "description": "The kind of document to create",
                },
            },
            "required": ["title", "kind"],
        },
    },
}

UPDATE_DOCUMENT_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "updateDocument",
        "description": "Update a document with the given description.",
        "parameters": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "description": "The ID of the document to update",
                },
                "description": {
                    "type": "string",
                    "description": "The description of changes that need to be made",
                },
            },
            "required": ["id", "description"],
        },
    },
}
