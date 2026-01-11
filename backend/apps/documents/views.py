import os
import uuid
from django.conf import settings
from django.http import FileResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Document, DocumentVersion
from .serializers import (
    DocumentSerializer,
    DocumentListSerializer,
    DocumentUploadSerializer,
    DocumentUpdateSerializer,
    DocumentVersionSerializer,
)
from services.document_converter import DocumentConverter


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for document CRUD operations."""

    serializer_class = DocumentSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentListSerializer
        return DocumentSerializer

    def create(self, request, *args, **kwargs):
        """Upload a new document."""
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data['file']
        title = serializer.validated_data.get('title', file.name)

        # Validate file type
        file_ext = os.path.splitext(file.name)[1].lower()
        if file_ext not in ['.docx', '.doc']:
            return Response(
                {'error': 'Only .docx files are supported'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save file
        doc_id = uuid.uuid4()
        file_path = self._save_file(file, doc_id, file_ext)

        # Convert to HTML
        converter = DocumentConverter()
        content_html = converter.docx_to_html(file_path)

        # Create document
        document = Document.objects.create(
            id=doc_id,
            user=request.user,
            title=title,
            original_filename=file.name,
            file_path=file_path,
            file_type=file_ext[1:],
            file_size=file.size,
            content_html=content_html,
        )

        return Response(
            DocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Update document content."""
        document = self.get_object()
        serializer = DocumentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if 'title' in serializer.validated_data:
            document.title = serializer.validated_data['title']

        if 'content_html' in serializer.validated_data:
            # Create version before updating
            self._create_version(document)
            document.content_html = serializer.validated_data['content_html']

        document.save()
        return Response(DocumentSerializer(document).data)

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export document as docx."""
        document = self.get_object()
        converter = DocumentConverter()

        # Generate docx from HTML
        export_path = converter.html_to_docx(
            document.content_html,
            document.title
        )

        from django.http import FileResponse
        response = FileResponse(
            open(export_path, 'rb'),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        # Remove .docx extension if already present in title
        filename = document.title
        if filename.lower().endswith('.docx'):
            filename = filename[:-5]
        response['Content-Disposition'] = f'attachment; filename="{filename}.docx"'
        return response

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Get document version history."""
        document = self.get_object()
        versions = document.versions.all()
        return Response(DocumentVersionSerializer(versions, many=True).data)

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Get current content as docx for preview."""
        document = self.get_object()
        converter = DocumentConverter()

        # Generate docx from current HTML content
        export_path = converter.html_to_docx(
            document.content_html,
            f"preview_{document.id}"
        )

        response = FileResponse(
            open(export_path, 'rb'),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = f'inline; filename="preview.docx"'
        return response

    def _save_file(self, file, doc_id, file_ext):
        """Save uploaded file to disk."""
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'documents')
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, f'{doc_id}{file_ext}')
        with open(file_path, 'wb+') as dest:
            for chunk in file.chunks():
                dest.write(chunk)
        return file_path

    def _create_version(self, document):
        """Create a new version of the document."""
        last_version = document.versions.first()
        version_number = (last_version.version_number + 1) if last_version else 1

        DocumentVersion.objects.create(
            document=document,
            version_number=version_number,
            content_html=document.content_html,
        )
