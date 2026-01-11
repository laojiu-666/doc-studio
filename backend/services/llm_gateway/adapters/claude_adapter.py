"""
Claude (Anthropic) adapter.
"""
from typing import Iterator, List, Dict
import anthropic
from .base import BaseLLMAdapter


class ClaudeAdapter(BaseLLMAdapter):
    """Adapter for Anthropic Claude API."""

    def __init__(self, api_key: str, model: str, base_url: str = None):
        super().__init__(api_key, model, base_url)
        self.client = anthropic.Anthropic(
            api_key=api_key,
            base_url=base_url if base_url else None
        )

    def stream_chat(self, messages: List[Dict[str, str]]) -> Iterator[str]:
        """Stream chat completion from Claude."""
        # Extract system message if present
        system_message = None
        chat_messages = []

        for msg in messages:
            if msg['role'] == 'system':
                system_message = msg['content']
            else:
                chat_messages.append(msg)

        with self.client.messages.stream(
            model=self.model,
            max_tokens=4096,
            system=system_message or "",
            messages=chat_messages
        ) as stream:
            for text in stream.text_stream:
                yield text

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """Get complete chat response from Claude."""
        system_message = None
        chat_messages = []

        for msg in messages:
            if msg['role'] == 'system':
                system_message = msg['content']
            else:
                chat_messages.append(msg)

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_message or "",
            messages=chat_messages
        )
        return response.content[0].text

    def test_connection(self) -> str:
        """Test Claude API connection."""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=10,
            messages=[{"role": "user", "content": "Hello"}]
        )
        return f"Connection successful. Model: {self.model}"
