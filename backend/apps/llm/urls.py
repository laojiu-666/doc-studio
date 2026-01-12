from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    APIKeyViewSet, LLMProviderViewSet,
    AdminProviderViewSet, AdminModelViewSet, SyncAllModelsView
)

router = DefaultRouter()
router.register(r'api-keys', APIKeyViewSet, basename='api-key')
router.register(r'providers', LLMProviderViewSet, basename='provider')

# Admin routes
admin_router = DefaultRouter()
admin_router.register(r'providers', AdminProviderViewSet, basename='admin-provider')
admin_router.register(r'models', AdminModelViewSet, basename='admin-model')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/', include(admin_router.urls)),
    path('admin/sync-all/', SyncAllModelsView.as_view(), name='sync-all-models'),
]
