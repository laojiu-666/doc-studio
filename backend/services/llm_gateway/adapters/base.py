"""
Base adapter interface for LLM providers.
"""
from abc import ABC, abstractmethod
from typing import Iterator, List, Dict


class BaseLLMAdapter(ABC):
    """Abstract base class for LLM adapters."""

    def __init__(self, api_key: str, model: str, base_url: str = None):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url

    @abstractmethod
    def stream_chat(self, messages: List[Dict[str, str]]) -> Iterator[str]:
        """
        Stream chat completion.

        Args:
            messages: List of message dicts with 'role' and 'content'

        Yields:
            String chunks of the response
        """
        pass

    @abstractmethod
    def chat(self, messages: List[Dict[str, str]]) -> str:
        """
        Get complete chat response.

        Args:
            messages: List of message dicts with 'role' and 'content'

        Returns:
            Complete response string
        """
        pass

    @abstractmethod
    def test_connection(self) -> str:
        """
        Test the API connection.

        Returns:
            Success message
        """
        pass
