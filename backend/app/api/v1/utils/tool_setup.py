"""Tool setup utilities for chat streaming."""

from typing import Any, Dict
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.mcp_tools.data360_mcp import get_mcp_tools
from app.ai.tools import (
    CREATE_DOCUMENT_TOOL_DEFINITION,
    GET_WEATHER_TOOL_DEFINITION,
    UPDATE_DOCUMENT_TOOL_DEFINITION,
    create_document_tool,
    get_weather,
    update_document_tool,
)


async def create_tool_wrappers(user_id: UUID, db: AsyncSession) -> Dict[str, Dict[str, Any]]:
    """
    Create async tool wrappers for OpenAI tools.
    These wrappers handle the _sse_writer parameter and pass user_id/db_session.
    """

    async def get_weather_wrapper(**kwargs):
        # Remove _sse_writer if present (weather doesn't need it)
        kwargs.pop("_sse_writer", None)
        return await get_weather(**kwargs)

    async def create_document_wrapper(**kwargs):
        sse_writer = kwargs.pop("_sse_writer", None)
        return await create_document_tool(
            title=kwargs["title"],
            kind=kwargs["kind"],
            user_id=str(user_id),
            db_session=db,
            sse_writer=sse_writer,
        )

    async def update_document_wrapper(**kwargs):
        sse_writer = kwargs.pop("_sse_writer", None)
        return await update_document_tool(
            document_id=kwargs["id"],
            description=kwargs["description"],
            user_id=str(user_id),
            db_session=db,
            sse_writer=sse_writer,
        )

    return {
        "getWeather": {
            "function": get_weather_wrapper,
            "type": "tool",
        },
        "createDocument": {
            "function": create_document_wrapper,
            "type": "tool",
        },
        "updateDocument": {
            "function": update_document_wrapper,
            "type": "tool",
        },
    }


async def prepare_tools(
    user_id: UUID, db: AsyncSession
) -> tuple[Dict[str, Dict[str, Any]], list[Dict[str, Any]]]:
    """
    Prepare tools and tool definitions for OpenAI streaming.
    Returns (tools_dict, tool_definitions_list).
    """
    # Base tool definitions
    tool_definitions = [
        GET_WEATHER_TOOL_DEFINITION,
        CREATE_DOCUMENT_TOOL_DEFINITION,
        UPDATE_DOCUMENT_TOOL_DEFINITION,
    ]

    # Create tool wrappers
    tools = await create_tool_wrappers(user_id, db)

    # Add MCP tools
    mcp_tools = await get_mcp_tools()
    for tool in mcp_tools:
        tools[tool["function"]["name"]] = {
            "function": None,
            "type": "mcp",
        }
        tool_definitions.append(tool)

    return tools, tool_definitions
