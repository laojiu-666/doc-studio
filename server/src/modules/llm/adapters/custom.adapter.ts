import { LLMAdapter, ChatMessage } from '../llm.interface';

export class CustomAdapter implements LLMAdapter {
  constructor(
    private apiKey: string,
    private baseUrl: string,
  ) {}

  async *chat(messages: ChatMessage[], stream: boolean): AsyncIterable<string> {
    // Custom adapter uses OpenAI-compatible API format
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        messages,
        stream,
      }),
    });

    if (!stream) {
      const data = await response.json();
      yield data.choices?.[0]?.message?.content || data.content || '';
      return;
    }

    const reader = response.body?.getReader();
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
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}
