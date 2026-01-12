from rest_framework import serializers
from .models import APIKey, LLMProvider, LLMModel


class LLMModelSerializer(serializers.ModelSerializer):
    """Serializer for LLM models."""

    class Meta:
        model = LLMModel
        fields = (
            'id', 'model_id', 'display_name', 'description',
            'input_price', 'output_price', 'context_length',
            'is_active', 'sort_order'
        )


class LLMProviderSerializer(serializers.ModelSerializer):
    """Serializer for LLM providers."""
    models = LLMModelSerializer(many=True, read_only=True)
    model_count = serializers.SerializerMethodField()

    class Meta:
        model = LLMProvider
        fields = ('id', 'name', 'display_name', 'default_base_url', 'api_format', 
                  'is_active', 'sort_order', 'models', 'model_count', 'updated_at')

    def get_model_count(self, obj):
        return obj.models.filter(is_active=True).count()


class LLMProviderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for provider list."""
    models = serializers.SerializerMethodField()

    class Meta:
        model = LLMProvider
        fields = ('id', 'name', 'display_name', 'default_base_url', 'api_format', 'is_active', 'models')

    def get_models(self, obj):
        active_models = obj.models.filter(is_active=True)
        return [{
            'model_id': m.model_id,
            'display_name': m.display_name,
            'input_price': float(m.input_price) if m.input_price else None,
            'output_price': float(m.output_price) if m.output_price else None,
            'context_length': m.context_length,
        } for m in active_models]


class APIKeySerializer(serializers.ModelSerializer):
    api_key = serializers.CharField(write_only=True, required=False)
    api_key_masked = serializers.SerializerMethodField()
    provider_id = serializers.UUIDField(write_only=True, required=False)
    provider_name = serializers.SerializerMethodField()
    provider_display_name = serializers.SerializerMethodField()

    class Meta:
        model = APIKey
        fields = (
            'id', 'name', 'provider', 'provider_id', 'provider_name', 'provider_display_name',
            'api_key', 'api_key_masked', 'base_url', 'model', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'provider')

    def get_api_key_masked(self, obj):
        """Return masked API key for display."""
        try:
            key = obj.get_api_key()
            if len(key) > 8:
                return f"{key[:4]}...{key[-4:]}"
            return "****"
        except Exception:
            return "****"

    def get_provider_name(self, obj):
        return obj.provider.name if obj.provider else None

    def get_provider_display_name(self, obj):
        return obj.provider.display_name if obj.provider else None

    def create(self, validated_data):
        api_key = validated_data.pop('api_key', None)
        provider_id = validated_data.pop('provider_id', None)
        
        if provider_id:
            validated_data['provider'] = LLMProvider.objects.get(id=provider_id)
        
        instance = APIKey(**validated_data)
        if api_key:
            instance.set_api_key(api_key)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        api_key = validated_data.pop('api_key', None)
        provider_id = validated_data.pop('provider_id', None)
        
        if provider_id:
            validated_data['provider'] = LLMProvider.objects.get(id=provider_id)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if api_key:
            instance.set_api_key(api_key)
        instance.save()
        return instance


class APIKeyListSerializer(serializers.ModelSerializer):
    api_key_masked = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    provider_display_name = serializers.SerializerMethodField()

    class Meta:
        model = APIKey
        fields = ('id', 'name', 'provider_name', 'provider_display_name', 
                  'api_key_masked', 'base_url', 'model', 'is_active', 'created_at')

    def get_api_key_masked(self, obj):
        try:
            key = obj.get_api_key()
            if len(key) > 8:
                return f"{key[:4]}...{key[-4:]}"
            return "****"
        except Exception:
            return "****"

    def get_provider_name(self, obj):
        return obj.provider.name if obj.provider else None

    def get_provider_display_name(self, obj):
        return obj.provider.display_name if obj.provider else None
