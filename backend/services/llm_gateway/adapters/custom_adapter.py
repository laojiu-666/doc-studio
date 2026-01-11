"""
Custom API adapter for OpenAI-compatible endpoints.
"""
from typing import Iterator, List, Dict
import httpx
import json
from .base import BaseLLMAdapter


class CustomAdapter(BaseLLMAdapter):
    """Adapter for custom OpenAI-compatible APIs."""

    def __init__(self, api_key: str, model: str, base_url: str = None):
        super().__init__(api_key, model, base_url)
        if not base_url:
            raise ValueError("base_url is required for custom adapter")
        self.base_url = base_url.rstrip('/')

    def stream_chat(self, messages: List[Dict[str, str]]) -> Iterator[str]:
        """Stream chat completion from custom API."""
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True
        }

        with httpx.Client(timeout=60.0) as client:
            with client.stream("POST", url, headers=headers, json=payload) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            choices = chunk.get("choices", [])
                            if choices:
                                content = choices[0].get("delta", {}).get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """Get complete chat response from custom API."""
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False
        }

        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    def test_connection(self) -> str:
        """Test custom API connection."""
        self.chat([{"role": "user", "content": "Hello"}])
        return f"Connection successful. Model: {self.model}"
