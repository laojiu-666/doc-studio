import type { Message, LLMProvider } from '../types';

export const chatApi = {
  getMessages: async (documentId: string): Promise<Message[]> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/chat/${documentId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  sendMessage: async function* (
    documentId: string,
    content: string,
    provider?: LLMProvider
  ): AsyncIterable<string> {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/chat/${documentId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, provider }),
    });

    const reader = res.body?.getReader();
    if (!reader) return;

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
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) yield parsed.content;
            if (parsed.error) throw new Error(parsed.error);
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  },
};
