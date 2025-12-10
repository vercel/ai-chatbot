from functools import cache

import httpx
from fastmcp import Client
from fastmcp.client.transports import SSETransport

from app.config import get_mcp_settings


@cache
def get_mcp_client() -> Client[SSETransport]:
    """Get a cached MCP client instance."""

    transport = SSETransport(
        url=get_mcp_settings().server_url,
        httpx_client_factory=create_httpx_client,
    )
    return Client(transport)



def create_httpx_client(
    headers: dict[str, str] | None = None,
    timeout: httpx.Timeout | None = None,
    auth: httpx.Auth | None = None,
) -> httpx.AsyncClient:
    """Create an httpx client with configurable SSL verification."""
    settings = get_mcp_settings()
    return httpx.AsyncClient(
        headers=headers,
        timeout=timeout or httpx.Timeout(settings.timeout),
        auth=auth,
        verify=settings.ssl_verify,
    )

