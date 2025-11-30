from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    POSTGRES_URL: str = "postgresql+asyncpg://user:password@localhost:5432/chatbot_db"
    POSTGRES_URL_SYNC: str = ""

    # JWT
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI
    XAI_API_KEY: str = ""
    AI_GATEWAY_URL: str = ""

    # App
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Blob
    BLOB_READ_WRITE_TOKEN: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        # Allow reading from .env file even if it doesn't exist
        env_file_encoding = "utf-8"


settings = Settings()

