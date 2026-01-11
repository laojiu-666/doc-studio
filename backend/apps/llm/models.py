import uuid
from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet
import base64
import os


def get_encryption_key():
    """Get or generate encryption key for API keys."""
    key = os.getenv('API_KEY_ENCRYPTION_KEY')
    if not key:
        # Generate a key for development (should be set in production)
        key = base64.urlsafe_b64encode(os.urandom(32)).decode()
    return key.encode() if isinstance(key, str) else key


class APIKey(models.Model):
    """User's LLM API key configuration."""

    PROVIDER_CHOICES = [
        ('openai', 'OpenAI'),
        ('claude', 'Claude (Anthropic)'),
        ('gemini', 'Google Gemini'),
        ('custom', 'Custom API'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='api_keys'
    )
    name = models.CharField(max_length=100)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    api_key_encrypted = models.TextField()
    base_url = models.URLField(blank=True, null=True)
    model = models.CharField(max_length=100, default='gpt-4')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_keys'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.provider})"

    def set_api_key(self, raw_key: str):
        """Encrypt and store the API key."""
        f = Fernet(get_encryption_key())
        self.api_key_encrypted = f.encrypt(raw_key.encode()).decode()

    def get_api_key(self) -> str:
        """Decrypt and return the API key."""
        f = Fernet(get_encryption_key())
        return f.decrypt(self.api_key_encrypted.encode()).decode()
