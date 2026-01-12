"""Import providers and models from one-api project."""
from django.core.management.base import BaseCommand
from apps.llm.models import LLMProvider, LLMModel

# one-api provider types (from relay/apitype/define.go)
PROVIDERS = [
    {'name': 'openai', 'display_name': 'OpenAI', 'api_format': 'openai', 'base_url': 'https://api.openai.com'},
    {'name': 'anthropic', 'display_name': 'Anthropic', 'api_format': 'anthropic', 'base_url': 'https://api.anthropic.com'},
    {'name': 'gemini', 'display_name': 'Google Gemini', 'api_format': 'google', 'base_url': 'https://generativelanguage.googleapis.com'},
    {'name': 'baidu', 'display_name': 'Baidu ERNIE', 'api_format': 'openai', 'base_url': 'https://aip.baidubce.com'},
    {'name': 'zhipu', 'display_name': 'Zhipu GLM', 'api_format': 'openai', 'base_url': 'https://open.bigmodel.cn'},
    {'name': 'ali', 'display_name': 'Aliyun Qwen', 'api_format': 'openai', 'base_url': 'https://dashscope.aliyuncs.com'},
    {'name': 'xunfei', 'display_name': 'Xunfei Spark', 'api_format': 'openai', 'base_url': None},
    {'name': 'tencent', 'display_name': 'Tencent Hunyuan', 'api_format': 'openai', 'base_url': None},
    {'name': 'moonshot', 'display_name': 'Moonshot', 'api_format': 'openai', 'base_url': 'https://api.moonshot.cn'},
    {'name': 'baichuan', 'display_name': 'Baichuan', 'api_format': 'openai', 'base_url': 'https://api.baichuan-ai.com'},
    {'name': 'minimax', 'display_name': 'MiniMax', 'api_format': 'openai', 'base_url': 'https://api.minimax.chat'},
    {'name': 'mistral', 'display_name': 'Mistral AI', 'api_format': 'openai', 'base_url': 'https://api.mistral.ai'},
    {'name': 'groq', 'display_name': 'Groq', 'api_format': 'openai', 'base_url': 'https://api.groq.com/openai'},
    {'name': 'deepseek', 'display_name': 'DeepSeek', 'api_format': 'openai', 'base_url': 'https://api.deepseek.com'},
    {'name': 'yi', 'display_name': 'Yi (Lingyiwanwu)', 'api_format': 'openai', 'base_url': 'https://api.lingyiwanwu.com'},
    {'name': 'stepfun', 'display_name': 'StepFun', 'api_format': 'openai', 'base_url': 'https://api.stepfun.com'},
    {'name': 'cohere', 'display_name': 'Cohere', 'api_format': 'openai', 'base_url': 'https://api.cohere.ai'},
    {'name': 'replicate', 'display_name': 'Replicate', 'api_format': 'openai', 'base_url': 'https://api.replicate.com'},
    {'name': 'openrouter', 'display_name': 'OpenRouter', 'api_format': 'openai', 'base_url': 'https://openrouter.ai/api'},
    {'name': 'ollama', 'display_name': 'Ollama', 'api_format': 'openai', 'base_url': 'http://localhost:11434'},
    {'name': 'xai', 'display_name': 'xAI Grok', 'api_format': 'openai', 'base_url': 'https://api.x.ai'},
]

# Model ratios from one-api (1 unit = $0.002/1K tokens, USD=500)
# Converted to price per million tokens
USD = 500
MILLI_USD = 1.0 / 1000 * USD
RMB = USD / 7

MODELS = {
    'openai': [
        ('gpt-4', 'GPT-4', 30.0, 60.0, 8192),
        ('gpt-4-32k', 'GPT-4 32K', 60.0, 120.0, 32768),
        ('gpt-4-turbo', 'GPT-4 Turbo', 10.0, 30.0, 128000),
        ('gpt-4o', 'GPT-4o', 2.50, 10.0, 128000),
        ('gpt-4o-mini', 'GPT-4o Mini', 0.15, 0.60, 128000),
        ('gpt-3.5-turbo', 'GPT-3.5 Turbo', 0.50, 1.50, 16385),
        ('o1', 'O1', 15.0, 60.0, 200000),
        ('o1-preview', 'O1 Preview', 15.0, 60.0, 128000),
        ('o1-mini', 'O1 Mini', 3.0, 12.0, 128000),
        ('o3-mini', 'O3 Mini', 1.10, 4.40, 200000),
        ('dall-e-3', 'DALL-E 3', 40.0, 40.0, None),
        ('whisper-1', 'Whisper', 6.0, 6.0, None),
        ('tts-1', 'TTS', 15.0, 15.0, None),
        ('tts-1-hd', 'TTS HD', 30.0, 30.0, None),
        ('text-embedding-3-small', 'Embedding 3 Small', 0.02, 0.02, 8191),
        ('text-embedding-3-large', 'Embedding 3 Large', 0.13, 0.13, 8191),
    ],
    'anthropic': [
        ('claude-3-opus-20240229', 'Claude 3 Opus', 15.0, 75.0, 200000),
        ('claude-3-sonnet-20240229', 'Claude 3 Sonnet', 3.0, 15.0, 200000),
        ('claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 3.0, 15.0, 200000),
        ('claude-3-5-haiku-20241022', 'Claude 3.5 Haiku', 1.0, 5.0, 200000),
        ('claude-3-haiku-20240307', 'Claude 3 Haiku', 0.25, 1.25, 200000),
        ('claude-2.1', 'Claude 2.1', 8.0, 24.0, 200000),
    ],
    'gemini': [
        ('gemini-2.0-flash', 'Gemini 2.0 Flash', 0.10, 0.40, 1048576),
        ('gemini-2.0-pro-exp-02-05', 'Gemini 2.0 Pro', 1.25, 5.0, 1048576),
        ('gemini-1.5-pro', 'Gemini 1.5 Pro', 1.25, 5.0, 2097152),
        ('gemini-1.5-flash', 'Gemini 1.5 Flash', 0.075, 0.30, 1048576),
        ('gemini-1.5-flash-8b', 'Gemini 1.5 Flash 8B', 0.0375, 0.15, 1048576),
    ],
    'baidu': [
        ('ERNIE-4.0-8K', 'ERNIE 4.0', 8.57, 8.57, 8192),
        ('ERNIE-3.5-8K', 'ERNIE 3.5', 0.86, 0.86, 8192),
        ('ERNIE-Speed-8K', 'ERNIE Speed', 0.29, 0.29, 8192),
        ('ERNIE-Speed-128K', 'ERNIE Speed 128K', 0.29, 0.29, 128000),
        ('ERNIE-Lite-8K-0922', 'ERNIE Lite', 0.57, 0.57, 8192),
    ],
    'zhipu': [
        ('glm-4-plus', 'GLM-4 Plus', 3.57, 3.57, 128000),
        ('glm-4', 'GLM-4', 7.14, 7.14, 128000),
        ('glm-4-air', 'GLM-4 Air', 0.036, 0.036, 128000),
        ('glm-4-airx', 'GLM-4 AirX', 0.71, 0.71, 8192),
        ('glm-4-long', 'GLM-4 Long', 0.071, 0.071, 1000000),
        ('glm-4-flash', 'GLM-4 Flash', 0, 0, 128000),
        ('glm-4v-plus', 'GLM-4V Plus', 0.29, 0.29, 8192),
    ],
    'ali': [
        ('qwen-max', 'Qwen Max', 1.71, 1.71, 32000),
        ('qwen-plus', 'Qwen Plus', 0.57, 0.57, 131072),
        ('qwen-turbo', 'Qwen Turbo', 0.21, 0.21, 131072),
        ('qwen-vl-max', 'Qwen VL Max', 2.14, 2.14, 32000),
        ('qwen-vl-plus', 'Qwen VL Plus', 1.07, 1.07, 8192),
        ('qwen2.5-72b-instruct', 'Qwen 2.5 72B', 0.29, 0.29, 131072),
        ('qwen2.5-32b-instruct', 'Qwen 2.5 32B', 2.14, 2.14, 131072),
        ('qwq-32b-preview', 'QwQ 32B', 0.14, 0.14, 32768),
        ('deepseek-r1', 'DeepSeek R1 (Ali)', 0.14, 0.14, 65536),
        ('deepseek-v3', 'DeepSeek V3 (Ali)', 0.071, 0.071, 65536),
    ],
    'xunfei': [
        ('SparkDesk-v4.0', 'Spark 4.0', 1.29, 1.29, 128000),
        ('SparkDesk-v3.5', 'Spark 3.5', 1.29, 1.29, 8192),
        ('SparkDesk-v3.5-32K', 'Spark 3.5 32K', 1.29, 1.29, 32000),
    ],
    'tencent': [
        ('hunyuan-turbo', 'Hunyuan Turbo', 1.07, 1.07, 32000),
        ('hunyuan-large', 'Hunyuan Large', 0.29, 0.29, 32000),
        ('hunyuan-standard', 'Hunyuan Standard', 0.057, 0.057, 32000),
        ('hunyuan-standard-256K', 'Hunyuan 256K', 0.036, 0.036, 256000),
        ('hunyuan-vision', 'Hunyuan Vision', 1.29, 1.29, 8192),
    ],
    'moonshot': [
        ('moonshot-v1-8k', 'Moonshot 8K', 0.86, 0.86, 8192),
        ('moonshot-v1-32k', 'Moonshot 32K', 1.71, 1.71, 32000),
        ('moonshot-v1-128k', 'Moonshot 128K', 4.29, 4.29, 128000),
    ],
    'baichuan': [
        ('Baichuan2-Turbo', 'Baichuan2 Turbo', 0.57, 0.57, 8192),
        ('Baichuan2-Turbo-192k', 'Baichuan2 192K', 1.14, 1.14, 192000),
    ],
    'minimax': [
        ('abab6.5-chat', 'ABAB 6.5', 2.14, 2.14, 8192),
        ('abab6.5s-chat', 'ABAB 6.5s', 0.71, 0.71, 245760),
        ('abab5.5-chat', 'ABAB 5.5', 1.07, 1.07, 16384),
    ],
    'mistral': [
        ('mistral-large-latest', 'Mistral Large', 4.0, 12.0, 128000),
        ('mistral-small-latest', 'Mistral Small', 1.0, 3.0, 32000),
        ('mistral-medium-latest', 'Mistral Medium', 2.7, 8.1, 32000),
        ('open-mixtral-8x7b', 'Mixtral 8x7B', 0.7, 0.7, 32000),
        ('open-mistral-7b', 'Mistral 7B', 0.25, 0.25, 32000),
        ('mistral-embed', 'Mistral Embed', 0.1, 0.1, 8192),
    ],
    'groq': [
        ('llama-3.1-70b-versatile', 'Llama 3.1 70B', 0.59, 0.79, 131072),
        ('llama-3.1-8b-instant', 'Llama 3.1 8B', 0.05, 0.08, 131072),
        ('llama3-70b-8192', 'Llama 3 70B', 0.59, 0.79, 8192),
        ('llama3-8b-8192', 'Llama 3 8B', 0.05, 0.08, 8192),
        ('mixtral-8x7b-32768', 'Mixtral 8x7B', 0.24, 0.24, 32768),
        ('gemma2-9b-it', 'Gemma 2 9B', 0.20, 0.20, 8192),
    ],
    'deepseek': [
        ('deepseek-chat', 'DeepSeek Chat', 0.14, 0.28, 65536),
        ('deepseek-reasoner', 'DeepSeek Reasoner', 0.55, 2.19, 65536),
    ],
    'yi': [
        ('yi-34b-chat-0205', 'Yi 34B', 0.36, 0.36, 4096),
        ('yi-34b-chat-200k', 'Yi 34B 200K', 1.71, 1.71, 200000),
        ('yi-vl-plus', 'Yi VL Plus', 0.86, 0.86, 4096),
    ],
    'stepfun': [
        ('step-1-8k', 'Step 1 8K', 0.036, 0.036, 8192),
        ('step-1-32k', 'Step 1 32K', 0.11, 0.11, 32000),
        ('step-1-128k', 'Step 1 128K', 0.29, 0.29, 128000),
        ('step-1-256k', 'Step 1 256K', 0.68, 0.68, 256000),
        ('step-2-16k', 'Step 2 16K', 0.27, 0.27, 16000),
    ],
    'cohere': [
        ('command-r-plus', 'Command R+', 3.0, 15.0, 128000),
        ('command-r', 'Command R', 0.5, 1.5, 128000),
        ('command', 'Command', 1.0, 2.0, 4096),
    ],
    'xai': [
        ('grok-beta', 'Grok Beta', 5.0, 15.0, 131072),
    ],
    'openrouter': [
        ('openai/gpt-4o', 'GPT-4o (OR)', 5.0, 15.0, 128000),
        ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet (OR)', 3.0, 15.0, 200000),
        ('google/gemini-pro-1.5', 'Gemini 1.5 Pro (OR)', 2.5, 7.5, 2097152),
        ('meta-llama/llama-3.3-70b-instruct', 'Llama 3.3 70B (OR)', 0.15, 0.15, 131072),
        ('deepseek/deepseek-r1', 'DeepSeek R1 (OR)', 1.2, 1.2, 65536),
    ],
}


class Command(BaseCommand):
    help = 'Import providers and models from one-api'

    def handle(self, *args, **options):
        # Import providers
        for idx, p in enumerate(PROVIDERS):
            provider, created = LLMProvider.objects.update_or_create(
                name=p['name'],
                defaults={
                    'display_name': p['display_name'],
                    'default_base_url': p['base_url'],
                    'api_format': p['api_format'],
                    'sort_order': idx,
                }
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(f'{action} provider: {p["display_name"]}')

            # Import models for this provider
            models = MODELS.get(p['name'], [])
            for midx, m in enumerate(models):
                model_id, display_name, input_price, output_price, context = m
                _, m_created = LLMModel.objects.update_or_create(
                    provider=provider,
                    model_id=model_id,
                    defaults={
                        'display_name': display_name,
                        'input_price': input_price,
                        'output_price': output_price,
                        'context_length': context,
                        'sort_order': midx,
                    }
                )
                m_action = 'Created' if m_created else 'Updated'
                self.stdout.write(f'  {m_action} model: {display_name}')

        self.stdout.write(self.style.SUCCESS('Import completed!'))
