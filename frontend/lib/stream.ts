/**
 * Stream utilities for handling SSE responses
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface StreamMessage {
  content?: string;
  done?: boolean;
  error?: string;
}

export async function* streamChat(
  sessionId: string,
  content: string,
  apiKeyId: string,
  token: string,
  mode: 'ask' | 'edit' = 'ask',
  selectedText?: string
): AsyncGenerator<StreamMessage> {
  const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/send_message/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, api_key_id: apiKeyId, mode, selected_text: selectedText }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data;
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  // Process any remaining data in buffer
  if (buffer.startsWith('data: ')) {
    try {
      const data = JSON.parse(buffer.slice(6));
      yield data;
    } catch {
      // Ignore parse errors
    }
  }
}
