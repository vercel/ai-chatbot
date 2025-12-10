"""
AI Client using LiteLLM for provider abstraction.
Supports OpenAI, Azure OpenAI, Anthropic, Google, and other providers.
"""

from typing import Any, Protocol, runtime_checkable

import litellm
from dotenv import load_dotenv

# Configure LiteLLM
litellm.drop_params = True  # Drop unsupported params for each provider
litellm.set_verbose = False  # Disable verbose logging by default

load_dotenv(
    ".env",
    override=True,
)


# ============================================================================
# Protocol Definitions - OpenAI-compatible interface contracts
# ============================================================================


@runtime_checkable
class ChatCompletionsProtocol(Protocol):
    """Protocol for synchronous chat completions."""

    def create(
        self,
        model: str,
        messages: list,
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        max_completion_tokens: int | None = None,
        tools: list | None = None,
        **kwargs: Any,
    ) -> Any:
        """Create a chat completion (sync)."""
        ...


@runtime_checkable
class AsyncChatCompletionsProtocol(Protocol):
    """Protocol for asynchronous chat completions."""

    async def create(
        self,
        model: str,
        messages: list,
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        max_completion_tokens: int | None = None,
        tools: list | None = None,
        **kwargs: Any,
    ) -> Any:
        """Create a chat completion (async)."""
        ...


@runtime_checkable
class OpenAIChatClientProtocol(Protocol):
    """Protocol for synchronous chat client with completions interface."""

    @property
    def chat(self) -> "OpenAICompletionsProtocol":
        """Access chat completions interface."""
        ...


@runtime_checkable
class AsyncOpenAIChatClientProtocol(Protocol):
    """Protocol for asynchronous chat client with completions interface."""

    @property
    def chat(self) -> "AsyncOpenACompletionsProtocol":
        """Access async chat completions interface."""
        ...


@runtime_checkable
class OpenAICompletionsProtocol(Protocol):
    """Protocol for container that holds chat completions."""

    @property
    def completions(self) -> ChatCompletionsProtocol:
        """Access completions interface."""
        ...


@runtime_checkable
class AsyncOpenACompletionsProtocol(Protocol):
    """Protocol for container that holds async chat completions."""

    @property
    def completions(self) -> AsyncChatCompletionsProtocol:
        """Access async completions interface."""
        ...


# ============================================================================
# LiteLLM Implementations
# ============================================================================

# Default model prefix for LiteLLM (e.g., "azure/", "openai/", "anthropic/")
DEFAULT_MODEL_PREFIX = "azure/"


class LiteLLMChatCompletions:
    """Synchronous chat completions implementation using LiteLLM."""

    def __init__(self, model_prefix: str = DEFAULT_MODEL_PREFIX):
        self.completions = self
        self._model_prefix = model_prefix

    def create(
        self,
        model: str,
        messages: list,
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        max_completion_tokens: int | None = None,
        tools: list | None = None,
        **kwargs: Any,
    ):
        """
        Create a chat completion using LiteLLM (synchronous).
        Supports both streaming and non-streaming responses.

        Args:
            model: Standard model name (e.g., "gpt-4o-mini"). The provider prefix
                   is added automatically based on the client configuration.
        """
        # Remove OpenAI-specific parameters not supported by LiteLLM
        kwargs.pop("store", None)
        kwargs.pop("system", None)  # system should be in messages

        # Use max_completion_tokens if provided, otherwise fall back to max_tokens
        effective_max_tokens = max_completion_tokens or max_tokens

        # Concatenate model prefix with model name for LiteLLM
        full_model_name = f"{self._model_prefix}{model}"

        return litellm.completion(
            model=full_model_name,
            messages=messages,
            stream=stream,
            temperature=temperature,
            max_tokens=effective_max_tokens,
            tools=tools,
            **kwargs,
        )


class LiteLLMAsyncChatCompletions:
    """Asynchronous chat completions implementation using LiteLLM."""

    def __init__(self, model_prefix: str = DEFAULT_MODEL_PREFIX):
        self.completions = self
        self._model_prefix = model_prefix

    async def create(
        self,
        model: str,
        messages: list,
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        max_completion_tokens: int | None = None,
        tools: list | None = None,
        **kwargs: Any,
    ):
        """
        Create a chat completion using LiteLLM (asynchronous).
        Supports both streaming and non-streaming responses.
        Use this for async streaming with `async for chunk in stream`.

        Args:
            model: Standard model name (e.g., "gpt-4o-mini"). The provider prefix
                   is added automatically based on the client configuration.
        """
        # Remove OpenAI-specific parameters not supported by LiteLLM
        kwargs.pop("store", None)
        kwargs.pop("system", None)  # system should be in messages

        # Use max_completion_tokens if provided, otherwise fall back to max_tokens
        effective_max_tokens = max_completion_tokens or max_tokens

        # Concatenate model prefix with model name for LiteLLM
        full_model_name = f"{self._model_prefix}{model}"

        return await litellm.acompletion(
            model=full_model_name,
            messages=messages,
            stream=stream,
            temperature=temperature,
            max_tokens=effective_max_tokens,
            tools=tools,
            **kwargs,
        )


class LiteLLMClient:
    """
    Synchronous LiteLLM client that provides an OpenAI-compatible interface.
    Implements ChatClientProtocol.
    """

    def __init__(self, model_prefix: str = DEFAULT_MODEL_PREFIX):
        self._chat = LiteLLMChatCompletions(model_prefix=model_prefix)

    @property
    def chat(self) -> LiteLLMChatCompletions:
        return self._chat


class LiteLLMAsyncClient:
    """
    Asynchronous LiteLLM client that provides an OpenAI-compatible interface.
    Implements AsyncChatClientProtocol.
    """

    def __init__(self, model_prefix: str = DEFAULT_MODEL_PREFIX):
        self._chat = LiteLLMAsyncChatCompletions(model_prefix=model_prefix)

    @property
    def chat(self) -> LiteLLMAsyncChatCompletions:
        return self._chat


# ============================================================================
# Factory Functions
# ============================================================================


def get_ai_client(model_prefix: str = DEFAULT_MODEL_PREFIX) -> OpenAIChatClientProtocol:
    """Get configured synchronous LiteLLM client."""
    return LiteLLMClient(model_prefix=model_prefix)


def get_async_ai_client(model_prefix: str = DEFAULT_MODEL_PREFIX) -> AsyncOpenAIChatClientProtocol:
    """Get configured asynchronous LiteLLM client."""
    return LiteLLMAsyncClient(model_prefix=model_prefix)


def get_model_name(model_id: str) -> str:
    """
    Map internal model IDs to standard model names.

    Returns the standard model name without provider prefix.
    The provider prefix (e.g., "azure/", "openai/") is handled by the client.

    Model mapping:
    - chat-model -> gpt-4o-mini
    - chat-model-reasoning -> o1-mini
    - title-model -> gpt-4o-mini
    - artifact-model -> gpt-4o-mini
    """
    model_mapping = {
        "chat-model": "gpt-4o-mini",
        "chat-model-reasoning": "o1-mini",
        "title-model": "gpt-4o-mini",
        "artifact-model": "gpt-4o-mini",
    }

    return model_mapping.get(model_id, "gpt-4o-mini")
