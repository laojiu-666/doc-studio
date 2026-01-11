"""
OpenAI adapter for GPT models.
"""
from typing import Iterator, List, Dict
from openai import OpenAI
from .base import BaseLLMAdapter


class OpenAIAdapter(BaseLLMAdapter):
    """Adapter for OpenAI API."""

    def __init__(self, api_key: str, model: str, base_url: str = None):
        super().__init__(api_key, model, base_url)
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url if base_url else None
        )

    def stream_chat(self, messages: List[Dict[str, str]]) -> Iterator[str]:
        """Stream chat completion from OpenAI."""
        stream = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=True
        )

        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """Get complete chat response from OpenAI."""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages
        )
        return response.choices[0].message.content

    def test_connection(self) -> str:
        """Test OpenAI API connection."""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        return f"Connection successful. Model: {self.model}"
