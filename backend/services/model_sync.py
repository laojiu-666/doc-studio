"""
Service for fetching and syncing LLM models from various providers.
"""
import httpx
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


# Default models for each provider with pricing and context info
# Prices are per million tokens (USD), context_length in tokens
DEFAULT_MODELS = {
    'openai': [
        {
            'model_id': 'gpt-4o',
            'display_name': 'GPT-4o',
            'input_price': 2.50,
            'output_price': 10.00,
            'context_length': 128000,
        },
        {
            'model_id': 'gpt-4o-mini',
            'display_name': 'GPT-4o Mini',
            'input_price': 0.15,
            'output_price': 0.60,
            'context_length': 128000,
        },
        {
            'model_id': 'gpt-4-turbo',
            'display_name': 'GPT-4 Turbo',
            'input_price': 10.00,
            'output_price': 30.00,
            'context_length': 128000,
        },
        {
            'model_id': 'gpt-4',
            'display_name': 'GPT-4',
            'input_price': 30.00,
            'output_price': 60.00,
            'context_length': 8192,
        },
        {
            'model_id': 'gpt-3.5-turbo',
            'display_name': 'GPT-3.5 Turbo',
            'input_price': 0.50,
            'output_price': 1.50,
            'context_length': 16385,
        },
        {
            'model_id': 'o1-preview',
            'display_name': 'O1 Preview',
            'input_price': 15.00,
            'output_price': 60.00,
            'context_length': 128000,
        },
        {
            'model_id': 'o1-mini',
            'display_name': 'O1 Mini',
            'input_price': 3.00,
            'output_price': 12.00,
            'context_length': 128000,
        },
        {
            'model_id': 'o3-mini',
            'display_name': 'O3 Mini',
            'input_price': 1.10,
            'output_price': 4.40,
            'context_length': 200000,
        },
    ],
    'claude': [
        {
            'model_id': 'claude-opus-4-20250514',
            'display_name': 'Claude Opus 4',
            'input_price': 15.00,
            'output_price': 75.00,
            'context_length': 200000,
        },
        {
            'model_id': 'claude-sonnet-4-20250514',
            'display_name': 'Claude Sonnet 4',
            'input_price': 3.00,
            'output_price': 15.00,
            'context_length': 200000,
        },
        {
            'model_id': 'claude-3-7-sonnet-20250219',
            'display_name': 'Claude 3.7 Sonnet',
            'input_price': 3.00,
            'output_price': 15.00,
            'context_length': 200000,
        },
        {
            'model_id': 'claude-3-5-sonnet-20241022',
            'display_name': 'Claude 3.5 Sonnet',
            'input_price': 3.00,
            'output_price': 15.00,
            'context_length': 200000,
        },
        {
            'model_id': 'claude-3-5-haiku-20241022',
            'display_name': 'Claude 3.5 Haiku',
            'input_price': 0.80,
            'output_price': 4.00,
            'context_length': 200000,
        },
        {
            'model_id': 'claude-3-opus-20240229',
            'display_name': 'Claude 3 Opus',
            'input_price': 15.00,
            'output_price': 75.00,
            'context_length': 200000,
        },
    ],
    'gemini': [
        {
            'model_id': 'gemini-2.5-pro-preview-06-05',
            'display_name': 'Gemini 2.5 Pro',
            'input_price': 1.25,
            'output_price': 10.00,
            'context_length': 1048576,
        },
        {
            'model_id': 'gemini-2.5-flash-preview-05-20',
            'display_name': 'Gemini 2.5 Flash',
            'input_price': 0.15,
            'output_price': 0.60,
            'context_length': 1048576,
        },
        {
            'model_id': 'gemini-2.0-flash',
            'display_name': 'Gemini 2.0 Flash',
            'input_price': 0.10,
            'output_price': 0.40,
            'context_length': 1048576,
        },
        {
            'model_id': 'gemini-2.0-flash-lite',
            'display_name': 'Gemini 2.0 Flash Lite',
            'input_price': 0.075,
            'output_price': 0.30,
            'context_length': 1048576,
        },
        {
            'model_id': 'gemini-1.5-pro',
            'display_name': 'Gemini 1.5 Pro',
            'input_price': 1.25,
            'output_price': 5.00,
            'context_length': 2097152,
        },
        {
            'model_id': 'gemini-1.5-flash',
            'display_name': 'Gemini 1.5 Flash',
            'input_price': 0.075,
            'output_price': 0.30,
            'context_length': 1048576,
        },
    ],
}

# Default provider configurations
DEFAULT_PROVIDERS = [
    {
        'name': 'openai',
        'display_name': 'OpenAI',
        'default_base_url': 'https://api.openai.com',
        'api_format': 'openai',
        'sort_order': 1,
    },
    {
        'name': 'claude',
        'display_name': 'Claude (Anthropic)',
        'default_base_url': 'https://api.anthropic.com',
        'api_format': 'anthropic',
        'sort_order': 2,
    },
    {
        'name': 'gemini',
        'display_name': 'Google Gemini',
        'default_base_url': 'https://generativelanguage.googleapis.com',
        'api_format': 'google',
        'sort_order': 3,
    },
    {
        'name': 'custom',
        'display_name': 'Custom API',
        'default_base_url': None,
        'api_format': 'openai',
        'sort_order': 99,
    },
]


class ModelSyncService:
    """Service for syncing LLM models from provider APIs."""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key
        self.base_url = base_url

    async def fetch_openai_models(self, api_key: str, base_url: str = 'https://api.openai.com') -> List[Dict]:
        """Fetch models from OpenAI API."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{base_url}/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"}
                )
                response.raise_for_status()
                data = response.json()
                
                # Filter for chat models
                chat_models = []
                default_models_map = {m['model_id']: m for m in DEFAULT_MODELS.get('openai', [])}
                
                for model in data.get('data', []):
                    model_id = model.get('id', '')
                    # Filter for GPT and O1 models
                    if any(prefix in model_id for prefix in ['gpt-4', 'gpt-3.5', 'o1-', 'o3-']):
                        model_info = {
                            'model_id': model_id,
                            'display_name': model_id.replace('-', ' ').title(),
                        }
                        # Add pricing info if available in defaults
                        if model_id in default_models_map:
                            model_info.update({
                                'input_price': default_models_map[model_id].get('input_price'),
                                'output_price': default_models_map[model_id].get('output_price'),
                                'context_length': default_models_map[model_id].get('context_length'),
                            })
                        chat_models.append(model_info)
                
                return sorted(chat_models, key=lambda x: x['model_id'])
        except Exception as e:
            logger.error(f"Failed to fetch OpenAI models: {e}")
            return DEFAULT_MODELS.get('openai', [])

    async def fetch_anthropic_models(self, api_key: str, base_url: str = 'https://api.anthropic.com') -> List[Dict]:
        """Fetch models from Anthropic API."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{base_url}/v1/models",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01"
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                models = []
                default_models_map = {m['model_id']: m for m in DEFAULT_MODELS.get('claude', [])}
                
                for model in data.get('data', []):
                    model_id = model.get('id', '')
                    model_info = {
                        'model_id': model_id,
                        'display_name': model.get('display_name', model_id),
                    }
                    # Add pricing info if available in defaults
                    if model_id in default_models_map:
                        model_info.update({
                            'input_price': default_models_map[model_id].get('input_price'),
                            'output_price': default_models_map[model_id].get('output_price'),
                            'context_length': default_models_map[model_id].get('context_length'),
                        })
                    models.append(model_info)
                
                return models if models else DEFAULT_MODELS.get('claude', [])
        except Exception as e:
            logger.error(f"Failed to fetch Anthropic models: {e}")
            return DEFAULT_MODELS.get('claude', [])

    async def fetch_gemini_models(self, api_key: str) -> List[Dict]:
        """Fetch models from Google Gemini API."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
                )
                response.raise_for_status()
                data = response.json()
                
                models = []
                default_models_map = {m['model_id']: m for m in DEFAULT_MODELS.get('gemini', [])}
                
                for model in data.get('models', []):
                    name = model.get('name', '')
                    # Extract model ID from full name (e.g., "models/gemini-pro" -> "gemini-pro")
                    model_id = name.replace('models/', '') if name.startswith('models/') else name
                    
                    # Filter for generateContent capable models
                    if 'generateContent' in model.get('supportedGenerationMethods', []):
                        model_info = {
                            'model_id': model_id,
                            'display_name': model.get('displayName', model_id),
                        }
                        # Add pricing info if available in defaults
                        if model_id in default_models_map:
                            model_info.update({
                                'input_price': default_models_map[model_id].get('input_price'),
                                'output_price': default_models_map[model_id].get('output_price'),
                                'context_length': default_models_map[model_id].get('context_length'),
                            })
                        models.append(model_info)
                
                return models if models else DEFAULT_MODELS.get('gemini', [])
        except Exception as e:
            logger.error(f"Failed to fetch Gemini models: {e}")
            return DEFAULT_MODELS.get('gemini', [])

    @staticmethod
    def get_default_models(provider_name: str) -> List[Dict]:
        """Get default models for a provider."""
        return DEFAULT_MODELS.get(provider_name, [])

    @staticmethod
    def get_default_providers() -> List[Dict]:
        """Get default provider configurations."""
        return DEFAULT_PROVIDERS


def initialize_default_data():
    """Initialize default providers and models in database."""
    from apps.llm.models import LLMProvider, LLMModel
    
    # Create default providers
    for provider_data in DEFAULT_PROVIDERS:
        provider, created = LLMProvider.objects.update_or_create(
            name=provider_data['name'],
            defaults={
                'display_name': provider_data['display_name'],
                'default_base_url': provider_data['default_base_url'],
                'api_format': provider_data['api_format'],
                'sort_order': provider_data['sort_order'],
            }
        )
        
        # Create default models for this provider
        default_models = DEFAULT_MODELS.get(provider_data['name'], [])
        for idx, model_data in enumerate(default_models):
            LLMModel.objects.update_or_create(
                provider=provider,
                model_id=model_data['model_id'],
                defaults={
                    'display_name': model_data['display_name'],
                    'input_price': model_data.get('input_price'),
                    'output_price': model_data.get('output_price'),
                    'context_length': model_data.get('context_length'),
                    'sort_order': idx,
                }
            )
    
    return True
