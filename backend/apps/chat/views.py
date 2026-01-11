import json
from django.http import StreamingHttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ChatSession, ChatMessage
from .serializers import (
    ChatSessionSerializer,
    ChatSessionListSerializer,
    ChatMessageSerializer,
    SendMessageSerializer,
)
from apps.llm.models import APIKey
from services.llm_gateway import LLMGateway


class ChatSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for chat session operations."""

    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return ChatSessionListSerializer
        return ChatSessionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message and get AI response (streaming)."""
        session = self.get_object()
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_content = serializer.validated_data['content']
        api_key_id = serializer.validated_data['api_key_id']
        mode = serializer.validated_data.get('mode', 'ask')
        selected_text = serializer.validated_data.get('selected_text', '')
        print(f"[DEBUG] Chat mode: {mode}, selected_text: {selected_text[:50] if selected_text else 'None'}")

        # Get API key
        try:
            api_key = APIKey.objects.get(
                id=api_key_id,
                user=request.user,
                is_active=True
            )
        except APIKey.DoesNotExist:
            return Response(
                {'error': 'API key not found or inactive'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save user message
        ChatMessage.objects.create(
            session=session,
            role='user',
            content=user_content
        )

        # Build messages for LLM
        messages = self._build_messages(session, user_content, mode, selected_text)

        # Stream response
        def generate():
            gateway = LLMGateway(api_key)
            full_response = ''

            try:
                for chunk in gateway.stream_chat(messages):
                    full_response += chunk
                    yield f"data: {json.dumps({'content': chunk})}\n\n"

                # Save assistant message
                ChatMessage.objects.create(
                    session=session,
                    role='assistant',
                    content=full_response
                )
                yield f"data: {json.dumps({'done': True})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        response = StreamingHttpResponse(
            generate(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

    def _build_messages(self, session, current_message, mode='ask', selected_text=''):
        """Build message history for LLM."""
        messages = []

        # System prompt based on mode
        if mode == 'edit':
            system_prompt = '''You are a document editing assistant. You help users edit their documents.

Rules:
1. When the user asks to modify, edit, or rewrite content, wrap the NEW content in <doc> tags
2. If the user has selected specific text, only return the replacement for that selection in <doc> tags
3. If NO text is selected but user wants to modify existing content, return the COMPLETE modified document in <doc-full> tags
4. Explanations should NOT be wrapped in any tags
5. For deletion requests with selected text, use empty <doc></doc>
6. IMPORTANT: Always use HTML format for content, NOT Markdown. For example:
   - Bold: <strong>text</strong> (NOT **text**)
   - Italic: <em>text</em> (NOT *text*)
   - Tables: <table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table> (NOT | col |)
   - Lists: <ul><li>item</li></ul> or <ol><li>item</li></ol>
   - Headings: <h1>Title</h1>, <h2>Subtitle</h2>

Example 1 - Creating a table:
User: Create a table with name and age
Assistant: Here's the table:
<doc>
<table>
<tr><th>Name</th><th>Age</th></tr>
<tr><td>Alice</td><td>25</td></tr>
<tr><td>Bob</td><td>30</td></tr>
</table>
</doc>

Example 2 - With selected text "Hello World":
User: Make this bold
Assistant: Here's the bold version:
<doc><strong>Hello World</strong></doc>

Example 3 - No selection, modify content:
User: Change the first paragraph to an introduction
Assistant: Here's the updated document:
<doc-full>
<p><strong>Welcome to our presentation!</strong></p>
<p>This is the second paragraph...</p>
</doc-full>'''

            if selected_text:
                system_prompt += f'\n\nThe user has selected: """{selected_text}"""\nReturn only the replacement in <doc> tags.'
            else:
                system_prompt += '\n\nNo text is selected. If modifying existing content, return the COMPLETE document in <doc-full> tags. If adding new content, use <doc> tags.'
        else:
            system_prompt = 'You are a helpful assistant.'

        # Add document context if exists
        if session.document:
            doc_content = session.document.content_html[:5000]
            system_prompt += f'\n\nThe user is working on a document. Here is the document content:\n\n{doc_content}'

        messages.append({
            'role': 'system',
            'content': system_prompt
        })

        # Add chat history (last 10 messages)
        history = session.messages.order_by('-created_at')[:10]
        for msg in reversed(list(history)):
            messages.append({
                'role': msg.role,
                'content': msg.content
            })

        # Add current message
        messages.append({
            'role': 'user',
            'content': current_message
        })

        return messages
