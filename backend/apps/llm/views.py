from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import APIKey
from .serializers import APIKeySerializer, APIKeyListSerializer
from services.llm_gateway import LLMGateway


class APIKeyViewSet(viewsets.ModelViewSet):
    """ViewSet for API key management."""

    serializer_class = APIKeySerializer

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user)

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
