from rest_framework import serializers
from .models import Document, DocumentVersion


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = (
            'id', 'title', 'original_filename', 'file_path', 'file_type',
            'file_size', 'content_html', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document list."""

    class Meta:
        model = Document
        fields = (
            'id', 'title', 'original_filename', 'file_type',
            'file_size', 'created_at', 'updated_at'
        )


class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    title = serializers.CharField(max_length=255, required=False)


class DocumentUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False)
    content_html = serializers.CharField(required=False, allow_blank=True)


class DocumentVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentVersion
        fields = ('id', 'version_number', 'created_at')
