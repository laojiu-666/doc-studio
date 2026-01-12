from django.contrib import admin
from .models import APIKey, LLMProvider, LLMModel


@admin.register(LLMProvider)
class LLMProviderAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name', 'api_format', 'is_active', 'sort_order', 'updated_at')
    list_filter = ('api_format', 'is_active')
    search_fields = ('name', 'display_name')
    ordering = ('sort_order', 'name')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(LLMModel)
class LLMModelAdmin(admin.ModelAdmin):
    list_display = ('model_id', 'display_name', 'provider', 'is_active', 'sort_order')
    list_filter = ('provider', 'is_active')
    search_fields = ('model_id', 'display_name')
    ordering = ('provider', 'sort_order', 'model_id')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'provider', 'model', 'is_active', 'created_at')
    list_filter = ('provider', 'is_active', 'created_at')
    search_fields = ('name', 'user__email')
    readonly_fields = ('id', 'created_at', 'updated_at')
