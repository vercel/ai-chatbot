import traceback

import json5

from ._client import get_mcp_client

# NOTE: Implement outputSchema for MCP tools. https://github.com/modelcontextprotocol/modelcontextprotocol/pull/371


async def main():
    client = get_mcp_client()
    async with client:
        # Basic server interaction
        await client.ping()

        # List available operations
        tools = await client.list_tools()
        # resources = await client.list_resources()
        # prompts = await client.list_prompts()

        print(tools)
        # print(resources)
        # print(prompts)

        # Execute operations
        result = await client.call_tool(
            "ai4data_ai4data_mcpsearch_relevant_indicators", {"query": "malnutrition"}
        )
        print(result)

        return tools


async def get_mcp_tools():
    # {'name': 'ai4data_ai4data_mcpsearch_relevant_indicators',
    #  'title': None,
    #  'description': "Search for a shortlist of relevant indicators from the World Development Indicators (WDI) Data360 API given the query. This tool is optimized for English language queries, so try to use English for your query. If the user's query is not in English, you may need to translate it to English first. This tool is used to find indicators and does not consider any geography or time period, so you should not include any in your query. The search ranking may not be optimal, so the LLM may use this as shortlist and pick the most relevant from the list (if any). You, as an LLM, must always get at least `top_k=20` for better recall.",
    #  'inputSchema': {'type': 'object',
    #   'properties': {'query': {'type': 'string',
    #     'description': "The search query by the user or one formulated by an LLM based on the user's prompt. This query should be in English. If the user's query is not in English, you may need to translate it to English first. This tool is used to find indicators and does not consider any geography or time period, so you should not include any in your query."},
    #    'top_k': {'type': 'number',
    #     'description': 'The number of shortlisted indicators that will be returned that are semantically related to the query. IMPORTANT: You, as an LLM, must ALWAYS set this argument to at least 20.'}}},
    #  'outputSchema': None,
    #  'icons': None,
    #  'annotations': None,
    #  'meta': None}

    client = get_mcp_client()
    async with client:
        tools = await client.list_tools()

        tool_definitions = []

        for tool in tools:
            _tool = tool.model_dump()

            _tool["parameters"] = _tool.pop("inputSchema")

            tool_definitions.append(
                {
                    "type": "function",
                    "function": _tool,
                    "strict": True,
                }
            )

        return tool_definitions


async def call_mcp_tool(tool_name: str, arguments: dict, as_jsonable: bool = True):
    try:
        client = get_mcp_client()
        async with client:
            result = await client.call_tool(tool_name, arguments)
            if as_jsonable:
                try:
                    return json5.loads(
                        result.content[0]
                        .text.lstrip("root=")
                        .replace(": None", ": null")
                        .replace(": True", ": true")
                        .replace(": False", ": false")
                        .strip()
                    )
                except Exception:
                    return result.content[0].model_dump()
            else:
                return result
    except Exception as e:
        tbck = traceback.format_exc()

        raise Exception(
            f"Error calling MCP tool {tool_name}, with arguments {arguments}: {str(e)}\n{tbck}"
        )
