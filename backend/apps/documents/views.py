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
from services.document_converter import DocumentConverter, get_converter


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for document CRUD operations."""

    serializer_class = DocumentSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    # Supported file extensions by category
    ALLOWED_EXTENSIONS = {
        'word': ['.doc', '.docx'],
        'ppt': ['.ppt', '.pptx'],
    }

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
        all_allowed = self.ALLOWED_EXTENSIONS['word'] + self.ALLOWED_EXTENSIONS['ppt']
        if file_ext not in all_allowed:
            return Response(
                {'error': 'Supported formats: .doc, .docx, .ppt, .pptx'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save file
        doc_id = uuid.uuid4()
        file_path = self._save_file(file, doc_id, file_ext)

        # Determine file type category
        if file_ext in self.ALLOWED_EXTENSIONS['word']:
            file_type = 'word'
            # Convert Word to HTML
            converter = DocumentConverter()
            content_html = converter.docx_to_html(file_path)
        else:
            file_type = 'ppt'
            # PPT files don't convert to HTML
            content_html = ''

        # Create document
        document = Document.objects.create(
            id=doc_id,
            user=request.user,
            title=title,
            original_filename=file.name,
            file_path=file_path,
            file_type=file_type,
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
        """Get current content as docx for preview using incremental converter."""
        document = self.get_object()

        # Use incremental converter for better performance
        converter = get_converter()
        export_path = converter.convert(
            document.content_html,
            doc_id=str(document.id)
        )

        response = FileResponse(
            open(export_path, 'rb'),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = f'inline; filename="preview.docx"'
        return response

    @action(detail=True, methods=['get'])
    def slides(self, request, pk=None):
        """Get PPT slides as images for preview."""
        document = self.get_object()

        if document.file_type != 'ppt':
            return Response(
                {'error': 'This endpoint is only for PPT documents'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if slides already generated
        slides_dir = os.path.join(settings.MEDIA_ROOT, 'slides', str(document.id))
        if os.path.exists(slides_dir):
            slides = self._get_slide_urls(slides_dir, document.id)
            return Response({'slides': slides})

        # Generate slides from PPT
        try:
            slides = self._convert_ppt_to_images(document)
            return Response({'slides': slides})
        except Exception as e:
            return Response(
                {'error': f'Failed to convert PPT: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def clear_preview_cache(self, request, pk=None):
        """Clear preview cache for this document."""
        document = self.get_object()
        converter = get_converter()
        converter.clear_cache(str(document.id))
        return Response({'status': 'cache cleared'})

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

    def _convert_ppt_to_images(self, document):
        """Convert PPT to images using LibreOffice and pdf2image."""
        import subprocess
        import tempfile

        slides_dir = os.path.join(settings.MEDIA_ROOT, 'slides', str(document.id))
        os.makedirs(slides_dir, exist_ok=True)

        # Use LibreOffice to convert PPT to PDF first
        with tempfile.TemporaryDirectory() as temp_dir:
            # Convert to PDF using LibreOffice
            subprocess.run([
                'soffice',
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', temp_dir,
                document.file_path
            ], check=True, timeout=120)

            # Find the generated PDF
            pdf_name = os.path.splitext(os.path.basename(document.file_path))[0] + '.pdf'
            pdf_path = os.path.join(temp_dir, pdf_name)

            if not os.path.exists(pdf_path):
                raise Exception('PDF conversion failed')

            # Convert PDF to images
            try:
                from pdf2image import convert_from_path
                images = convert_from_path(pdf_path, dpi=150)

                for i, image in enumerate(images):
                    image_path = os.path.join(slides_dir, f'slide_{i + 1}.png')
                    image.save(image_path, 'PNG')
            except ImportError:
                raise Exception('pdf2image not installed')

        return self._get_slide_urls(slides_dir, document.id)

    def _get_slide_urls(self, slides_dir, doc_id):
        """Get list of slide image URLs."""
        slides = []
        if os.path.exists(slides_dir):
            files = sorted([f for f in os.listdir(slides_dir) if f.endswith('.png')])
            for i, filename in enumerate(files):
                slides.append({
                    'page': i + 1,
                    'url': f'{settings.MEDIA_URL}slides/{doc_id}/{filename}'
                })
        return slides
