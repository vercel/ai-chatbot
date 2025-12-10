from typing import List, Union

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
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI
    OPENAI_API_KEY: str = ""  # OpenAI API key for aisuite
    XAI_API_KEY: str = ""  # Deprecated: kept for backward compatibility
    AI_GATEWAY_URL: str = ""  # Deprecated: using aisuite instead

    # App
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3001"
    NEXTJS_URL: str = "http://localhost:3001"  # Next.js server URL for proxy requests
    INTERNAL_API_SECRET: str = (
        "dev-internal-secret-change-in-production"  # Secret for FastAPI → Next.js internal requests
    )

    # Authentication
    DISABLE_AUTH: bool = False  # Set to True to disable authentication (uses session ID instead)

    # Blob
    BLOB_READ_WRITE_TOKEN: str = ""

    # Redis - Optional: Only needed for resumable streams
    REDIS_URL: str = ""

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
        extrac = 'ignore'

import dotenv
dotenv.load_dotenv()
settings = Settings()
