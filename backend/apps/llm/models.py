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


class LLMProvider(models.Model):
    """LLM Provider configuration (managed by admin)."""

    API_FORMAT_CHOICES = [
        ('openai', 'OpenAI Compatible'),
        ('anthropic', 'Anthropic'),
        ('google', 'Google Generative AI'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    display_name = models.CharField(max_length=100)
    default_base_url = models.URLField(blank=True, null=True)
    api_format = models.CharField(max_length=20, choices=API_FORMAT_CHOICES, default='openai')
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'llm_providers'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.display_name


class LLMModel(models.Model):
    """LLM Model configuration (managed by admin)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(
        LLMProvider,
        on_delete=models.CASCADE,
        related_name='models'
    )
    model_id = models.CharField(max_length=100)
    display_name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    # Pricing per million tokens (USD)
    input_price = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True,
        help_text='Input price per million tokens (USD)'
    )
    output_price = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True,
        help_text='Output price per million tokens (USD)'
    )
    # Context window size
    context_length = models.IntegerField(
        null=True, blank=True,
        help_text='Maximum context length in tokens'
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'llm_models'
        ordering = ['provider', 'sort_order', 'model_id']
        unique_together = ['provider', 'model_id']

    def __str__(self):
        return f"{self.provider.display_name} - {self.display_name}"


class APIKey(models.Model):
    """User's LLM API key configuration."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='api_keys'
    )
    name = models.CharField(max_length=100)
    provider = models.ForeignKey(
        LLMProvider,
        on_delete=models.SET_NULL,
        null=True,
        related_name='api_keys'
    )
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
        provider_name = self.provider.display_name if self.provider else 'Unknown'
        return f"{self.name} ({provider_name})"

    def set_api_key(self, raw_key: str):
        """Encrypt and store the API key."""
        f = Fernet(get_encryption_key())
        self.api_key_encrypted = f.encrypt(raw_key.encode()).decode()

    def get_api_key(self) -> str:
        """Decrypt and return the API key."""
        f = Fernet(get_encryption_key())
        return f.decrypt(self.api_key_encrypted.encode()).decode()
