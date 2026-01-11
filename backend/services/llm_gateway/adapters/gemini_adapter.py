"""
Google Gemini adapter.
"""
from typing import Iterator, List, Dict
import google.generativeai as genai
from .base import BaseLLMAdapter


class GeminiAdapter(BaseLLMAdapter):
    """Adapter for Google Gemini API."""

    def __init__(self, api_key: str, model: str, base_url: str = None):
        super().__init__(api_key, model, base_url)
        genai.configure(api_key=api_key)
        self.model_instance = genai.GenerativeModel(model)

    def stream_chat(self, messages: List[Dict[str, str]]) -> Iterator[str]:
        """Stream chat completion from Gemini."""
        # Convert messages to Gemini format
        gemini_messages = self._convert_messages(messages)

        chat = self.model_instance.start_chat(history=gemini_messages[:-1])
        response = chat.send_message(
            gemini_messages[-1]['parts'][0] if gemini_messages else "",
            stream=True
        )

        for chunk in response:
            if chunk.text:
                yield chunk.text

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """Get complete chat response from Gemini."""
        gemini_messages = self._convert_messages(messages)

        chat = self.model_instance.start_chat(history=gemini_messages[:-1])
        response = chat.send_message(
            gemini_messages[-1]['parts'][0] if gemini_messages else ""
        )
        return response.text

    def test_connection(self) -> str:
        """Test Gemini API connection."""
        response = self.model_instance.generate_content("Hello")
        return f"Connection successful. Model: {self.model}"

    def _convert_messages(self, messages: List[Dict[str, str]]) -> List[Dict]:
        """Convert OpenAI-style messages to Gemini format."""
        gemini_messages = []

        for msg in messages:
            role = msg['role']
            content = msg['content']

            # Map roles
            if role == 'system':
                # Prepend system message to first user message
                continue
            elif role == 'assistant':
                gemini_role = 'model'
            else:
                gemini_role = 'user'

            gemini_messages.append({
                'role': gemini_role,
                'parts': [content]
            })

        return gemini_messages
