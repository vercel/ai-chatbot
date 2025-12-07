"""
AI Client using aisuite for provider abstraction.
Supports OpenAI and can be extended to other providers.
"""

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(
    ".env",
    override=True,
)


def get_ai_client() -> OpenAI:
    """Get configured aisuite client."""
    return OpenAI()


def get_model_name(model_id: str) -> str:
    """
    Map internal model IDs to aisuite model names.

    Model mapping:
    - chat-model -> openai:gpt-4.1-mini (or openai:gpt-4.1-mini for vision)
    - chat-model-reasoning -> openai:gpt-5-mini (with reasoning)
    - title-model -> openai:gpt-4.1-mini
    - artifact-model -> openai:gpt-4.1-mini
    """
    model_mapping = {
        "chat-model": "gpt-4.1-mini",
        "chat-model-reasoning": "gpt-5-mini",
        "title-model": "gpt-4.1-mini",
        "artifact-model": "gpt-4.1-mini",
    }

    return model_mapping.get(model_id, "gpt-4.1-mini")
