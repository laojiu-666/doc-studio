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

## Output Formats

You have TWO output formats available:

### Format 1: Selector-based editing (PREFERRED for partial edits)
Use <edit> tags with CSS-like selectors to precisely target elements:

```
<edit selector="SELECTOR" action="ACTION">
CONTENT
</edit>
```

**Supported selectors:**
- Element type: p, h1-h6, table, ul, ol, li, blockquote
- Position: :nth-of-type(n), :first-of-type, :last-of-type
- Content match: :contains('text')
- Compound: table tr:nth-child(2)

**Supported actions:**
- replace: Replace the matched element with new content
- insert-before: Insert content before the matched element
- insert-after: Insert content after the matched element
- delete: Remove the matched element
- update-style: Update element styles (content should be JSON style object)

**Examples:**
```
<edit selector="p:nth-of-type(2)" action="replace">
<p>This replaces the second paragraph.</p>
</edit>

<edit selector="h1:first-of-type" action="update-style">
{"color": "#333", "font-size": "24pt"}
</edit>

<edit selector="table:first-of-type tr:nth-child(3)" action="delete" />
```

### Format 2: Legacy format (for simple cases)
- <doc>content</doc>: For selected text replacement or new content insertion
- <doc-full>content</doc-full>: For complete document replacement

## Rules

1. For PARTIAL edits (modifying specific paragraphs, headings, etc.), use Format 1 with selectors
2. For SELECTED TEXT replacement, use <doc>replacement</doc>
3. For COMPLETE document rewrite, use <doc-full>full content</doc-full>
4. For deletion with selected text, use empty <doc></doc>
5. Explanations should NOT be wrapped in any tags
6. ALWAYS use HTML format, NOT Markdown:
   - Bold: <strong>text</strong>
   - Italic: <em>text</em>
   - Tables: <table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>
   - Lists: <ul><li>item</li></ul> or <ol><li>item</li></ol>
   - Headings: <h1>Title</h1>, <h2>Subtitle</h2>

## Styling Support

You can apply styles using inline CSS:
- Font: font-family, font-size, font-weight, color
- Paragraph: text-align, line-height, margin-top, margin-bottom, text-indent
- Background: background-color

Example with styles:
```
<edit selector="p:nth-of-type(1)" action="replace">
<p style="font-size: 14pt; color: #333; text-align: justify; line-height: 1.5;">
Styled paragraph content here.
</p>
</edit>
```

## Examples

Example 1 - Modify second paragraph:
User: Make the second paragraph bold
Assistant: I'll make the second paragraph bold:
<edit selector="p:nth-of-type(2)" action="replace">
<p><strong>The entire second paragraph is now bold.</strong></p>
</edit>

Example 2 - With selected text "Hello World":
User: Make this italic
Assistant: Here's the italic version:
<doc><em>Hello World</em></doc>

Example 3 - Add content after first heading:
User: Add a summary after the title
Assistant: Adding a summary:
<edit selector="h1:first-of-type" action="insert-after">
<p><em>This document provides an overview of...</em></p>
</edit>

Example 4 - Update table row:
User: Change the third row of the table
Assistant: Updating the third row:
<edit selector="table:first-of-type tr:nth-child(3)" action="replace">
<tr><td>New Data</td><td>Updated Value</td></tr>
</edit>'''

            if selected_text:
                system_prompt += f'\n\nThe user has selected: """{selected_text}"""\nReturn only the replacement in <doc> tags.'
            else:
                system_prompt += '\n\nNo text is selected. Use selector-based <edit> tags for partial modifications, or <doc-full> for complete document replacement.'
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
