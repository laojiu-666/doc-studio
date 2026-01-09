import { LLMAdapter, ChatMessage } from '../llm.interface';

export class GeminiAdapter implements LLMAdapter {
  constructor(
    private apiKey: string,
    private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta',
  ) {}

  async *chat(messages: ChatMessage[], stream: boolean): AsyncIterable<string> {
    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
    const url = `${this.baseUrl}/models/gemini-1.5-flash:${endpoint}?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
      }),
    });

    if (!stream) {
      const data = await response.json();
      yield data.candidates[0].content.parts[0].text;
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

      // Gemini returns JSON array chunks
      try {
        const matches = buffer.match(/\{[^{}]*"text"[^{}]*\}/g);
        if (matches) {
          for (const match of matches) {
            const parsed = JSON.parse(match);
            if (parsed.text) yield parsed.text;
          }
          buffer = '';
        }
      } catch {
        // Continue accumulating
      }
    }
  }
}
