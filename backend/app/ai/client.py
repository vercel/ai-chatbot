"""
AI Client using aisuite for provider abstraction.
Supports OpenAI and can be extended to other providers.
"""

import aisuite as ai
from app.config import settings


def get_ai_client() -> ai.Client:
    """Get configured aisuite client."""
    return ai.Client()


def get_model_name(model_id: str) -> str:
    """
    Map internal model IDs to aisuite model names.

    Model mapping:
    - chat-model -> openai:gpt-4.1-mini (or openai:gpt-4.1-mini for vision)
    - chat-model-reasoning -> openai:o4-mini (with reasoning)
    - title-model -> openai:gpt-4.1-mini
    - artifact-model -> openai:gpt-4.1-mini
    """
    model_mapping = {
        "chat-model": "openai:gpt-4.1-mini",
        "chat-model-reasoning": "openai:o4-mini",
        "title-model": "openai:gpt-4.1-mini",
        "artifact-model": "openai:gpt-4.1-mini",
    }

    return model_mapping.get(model_id, "openai:gpt-4.1-mini")
