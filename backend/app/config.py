from typing import List, Union

import dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database - REQUIRED: Must be set in .env file
    # Format: postgresql+asyncpg://user:password@host:port/database
    POSTGRES_URL: str
    POSTGRES_URL_SYNC: str = ""

    # JWT - Optional: Only needed when using FastAPI auth endpoints
    # For development/testing, you can use any random string
    # For production, use: openssl rand -hex 32
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    # Optional: Old JWT secret key for key rotation (allows validating old tokens during rotation)
    JWT_SECRET_KEY_OLD: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Session Token Secret - Separate from JWT for better security isolation
    # If not set, falls back to JWT_SECRET_KEY for backward compatibility
    # For production, use: openssl rand -hex 32
    SESSION_SECRET_KEY: str = ""

    # AI
    OPENAI_API_KEY: str = ""  # OpenAI API key for aisuite
    XAI_API_KEY: str = ""  # Deprecated: kept for backward compatibility
    AI_GATEWAY_URL: str = ""  # Deprecated: using aisuite instead
    MODEL_PREFIX: str = "azure/"

    # App
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3001"
    NEXTJS_URL: str = "http://localhost:3001"  # Next.js server URL for proxy requests
    INTERNAL_API_SECRET: str = (
        "dev-internal-secret-change-in-production"  # Secret for FastAPI → Next.js internal requests
    )

    # Authentication
    # Note: Authentication is always enabled. Guest users provide anonymous access.

    # Blob
    BLOB_READ_WRITE_TOKEN: str = ""

    # Redis - Optional: Only needed for resumable streams
    REDIS_URL: str = ""

    # Password Security
    ENABLE_HIBP_CHECK: bool = False  # Enable Have I Been Pwned password checking

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            # Split comma-separated string and strip whitespace
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = "utf-8"
        extra = "ignore"


class MCPSettings(BaseSettings):
    """Settings for MCP (Model Context Protocol) server connections."""

    server_url: str = "https://ai4data-ai4data-mcp.hf.space/gradio_api/mcp/sse"
    ssl_verify: bool = True  # Set to False for dev environments with proxy/self-signed certs
    timeout: float = 30.0  # HTTP timeout in seconds

    class Config:
        env_prefix = "MCP_"
        case_sensitive = False
        extra = "ignore"


def get_settings() -> Settings:
    """Load environment variables and return Settings instance."""
    dotenv.load_dotenv()
    return Settings()


def get_mcp_settings() -> MCPSettings:
    """Load environment variables and return MCPSettings instance."""
    dotenv.load_dotenv()
    return MCPSettings()


# Initialize settings after loading dotenv
dotenv.load_dotenv()
settings = Settings()
