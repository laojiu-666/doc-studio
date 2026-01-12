from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from django.db import transaction
import asyncio

from .models import APIKey, LLMProvider, LLMModel
from .serializers import (
    APIKeySerializer, APIKeyListSerializer,
    LLMProviderSerializer, LLMProviderListSerializer, LLMModelSerializer
)
from services.llm_gateway import LLMGateway
from services.model_sync import ModelSyncService, initialize_default_data, DEFAULT_MODELS


class APIKeyViewSet(viewsets.ModelViewSet):
    """ViewSet for API key management."""

    serializer_class = APIKeySerializer

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user).select_related('provider')

    def get_serializer_class(self):
        if self.action == 'list':
            return APIKeyListSerializer
        return APIKeySerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test an API key by making a simple request."""
        api_key = self.get_object()

        try:
            gateway = LLMGateway(api_key)
            result = gateway.test_connection()
            return Response({'success': True, 'message': result})
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class LLMProviderViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for LLM providers (read-only for regular users)."""

    queryset = LLMProvider.objects.filter(is_active=True)
    serializer_class = LLMProviderListSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LLMProviderSerializer
        return LLMProviderListSerializer


class AdminProviderViewSet(viewsets.ModelViewSet):
    """Admin ViewSet for managing LLM providers."""

    queryset = LLMProvider.objects.all()
    serializer_class = LLMProviderSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['post'])
    def initialize(self, request):
        """Initialize default providers and models."""
        try:
            initialize_default_data()
            return Response({
                'success': True,
                'message': 'Default providers and models initialized successfully'
            })
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def sync_models(self, request, pk=None):
        """Sync models for a specific provider using provided API key."""
        provider = self.get_object()
        api_key = request.data.get('api_key')
        
        if not api_key:
            return Response(
                {'success': False, 'error': 'API key is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            sync_service = ModelSyncService()
            
            # Run async function
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                if provider.name == 'openai':
                    models = loop.run_until_complete(
                        sync_service.fetch_openai_models(api_key, provider.default_base_url or 'https://api.openai.com')
                    )
                elif provider.name == 'claude':
                    models = loop.run_until_complete(
                        sync_service.fetch_anthropic_models(api_key, provider.default_base_url or 'https://api.anthropic.com')
                    )
                elif provider.name == 'gemini':
                    models = loop.run_until_complete(
                        sync_service.fetch_gemini_models(api_key)
                    )
                else:
                    return Response(
                        {'success': False, 'error': 'Provider does not support model sync'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            finally:
                loop.close()

            # Update models in database
            with transaction.atomic():
                for idx, model_data in enumerate(models):
                    LLMModel.objects.update_or_create(
                        provider=provider,
                        model_id=model_data['model_id'],
                        defaults={
                            'display_name': model_data['display_name'],
                            'input_price': model_data.get('input_price'),
                            'output_price': model_data.get('output_price'),
                            'context_length': model_data.get('context_length'),
                            'sort_order': idx,
                            'is_active': True,
                        }
                    )

            return Response({
                'success': True,
                'message': f'Synced {len(models)} models for {provider.display_name}',
                'models_count': len(models)
            })

        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def reset_to_default(self, request, pk=None):
        """Reset provider models to default list."""
        provider = self.get_object()
        
        try:
            default_models = DEFAULT_MODELS.get(provider.name, [])
            
            if not default_models:
                return Response(
                    {'success': False, 'error': 'No default models for this provider'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                # Deactivate all existing models
                provider.models.update(is_active=False)
                
                # Create/update default models
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
                            'is_active': True,
                        }
                    )

            return Response({
                'success': True,
                'message': f'Reset {len(default_models)} models for {provider.display_name}'
            })

        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminModelViewSet(viewsets.ModelViewSet):
    """Admin ViewSet for managing LLM models."""

    queryset = LLMModel.objects.all()
    serializer_class = LLMModelSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = LLMModel.objects.all()
        provider_id = self.request.query_params.get('provider')
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
        return queryset


class SyncAllModelsView(APIView):
    """Admin endpoint to sync all provider models at once."""
    
    permission_classes = [IsAdminUser]

    def post(self, request):
        """Sync models for all providers using provided API keys."""
        api_keys = request.data.get('api_keys', {})
        # Expected format: {'openai': 'sk-...', 'claude': 'sk-ant-...', 'gemini': 'AIza...'}
        
        results = {}
        sync_service = ModelSyncService()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            for provider in LLMProvider.objects.filter(is_active=True):
                if provider.name in api_keys:
                    api_key = api_keys[provider.name]
                    try:
                        if provider.name == 'openai':
                            models = loop.run_until_complete(
                                sync_service.fetch_openai_models(api_key)
                            )
                        elif provider.name == 'claude':
                            models = loop.run_until_complete(
                                sync_service.fetch_anthropic_models(api_key)
                            )
                        elif provider.name == 'gemini':
                            models = loop.run_until_complete(
                                sync_service.fetch_gemini_models(api_key)
                            )
                        else:
                            continue

                        # Update models
                        with transaction.atomic():
                            for idx, model_data in enumerate(models):
                                LLMModel.objects.update_or_create(
                                    provider=provider,
                                    model_id=model_data['model_id'],
                                    defaults={
                                        'display_name': model_data['display_name'],
                                        'input_price': model_data.get('input_price'),
                                        'output_price': model_data.get('output_price'),
                                        'context_length': model_data.get('context_length'),
                                        'sort_order': idx,
                                        'is_active': True,
                                    }
                                )

                        results[provider.name] = {
                            'success': True,
                            'models_count': len(models)
                        }
                    except Exception as e:
                        results[provider.name] = {
                            'success': False,
                            'error': str(e)
                        }
        finally:
            loop.close()

        return Response({
            'success': True,
            'results': results
        })
