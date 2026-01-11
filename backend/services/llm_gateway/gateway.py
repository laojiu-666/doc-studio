"""
LLM Gateway service for handling multiple LLM providers.
"""
from typing import Iterator, List, Dict, Any
from .adapters import OpenAIAdapter, ClaudeAdapter, GeminiAdapter, CustomAdapter


class LLMGateway:
    """Gateway for routing requests to different LLM providers."""

    def __init__(self, api_key_config):
        """
        Initialize the gateway with an API key configuration.

        Args:
            api_key_config: APIKey model instance
        """
        self.config = api_key_config
        self.adapter = self._get_adapter()

    def _get_adapter(self):
        """Get the appropriate adapter for the provider."""
        provider = self.config.provider
        api_key = self.config.get_api_key()
        model = self.config.model
        base_url = self.config.base_url

        adapters = {
            'openai': OpenAIAdapter,
            'claude': ClaudeAdapter,
            'gemini': GeminiAdapter,
            'custom': CustomAdapter,
        }

        adapter_class = adapters.get(provider, CustomAdapter)
        return adapter_class(api_key=api_key, model=model, base_url=base_url)

    def stream_chat(self, messages: List[Dict[str, str]]) -> Iterator[str]:
        """
        Stream chat completion from the LLM.

        Args:
            messages: List of message dicts with 'role' and 'content'

        Yields:
            String chunks of the response
        """
        return self.adapter.stream_chat(messages)

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """
        Get a complete chat response from the LLM.

        Args:
            messages: List of message dicts with 'role' and 'content'

        Returns:
            Complete response string
        """
        return self.adapter.chat(messages)

    def test_connection(self) -> str:
        """
        Test the API connection.

        Returns:
            Success message or raises exception
        """
        return self.adapter.test_connection()
