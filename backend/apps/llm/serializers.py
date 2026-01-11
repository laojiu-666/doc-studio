from rest_framework import serializers
from .models import APIKey


class APIKeySerializer(serializers.ModelSerializer):
    api_key = serializers.CharField(write_only=True, required=False)
    api_key_masked = serializers.SerializerMethodField()

    class Meta:
        model = APIKey
        fields = (
            'id', 'name', 'provider', 'api_key', 'api_key_masked',
            'base_url', 'model', 'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

    def get_api_key_masked(self, obj):
        """Return masked API key for display."""
        try:
            key = obj.get_api_key()
            if len(key) > 8:
                return f"{key[:4]}...{key[-4:]}"
            return "****"
        except Exception:
            return "****"

    def create(self, validated_data):
        api_key = validated_data.pop('api_key', None)
        instance = APIKey(**validated_data)
        if api_key:
            instance.set_api_key(api_key)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        api_key = validated_data.pop('api_key', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if api_key:
            instance.set_api_key(api_key)
        instance.save()
        return instance


class APIKeyListSerializer(serializers.ModelSerializer):
    api_key_masked = serializers.SerializerMethodField()

    class Meta:
        model = APIKey
        fields = ('id', 'name', 'provider', 'api_key_masked', 'base_url', 'model', 'is_active', 'created_at')

    def get_api_key_masked(self, obj):
        try:
            key = obj.get_api_key()
            if len(key) > 8:
                return f"{key[:4]}...{key[-4:]}"
            return "****"
        except Exception:
            return "****"
