export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMAdapter {
  chat(messages: ChatMessage[], stream: boolean): AsyncIterable<string>;
}

export type LLMProvider = 'openai' | 'claude' | 'gemini' | 'custom';
