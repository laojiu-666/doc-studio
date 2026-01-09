export interface User {
  id: string;
  email: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  provider: string;
  key: string;
  baseUrl?: string;
  createdAt: string;
}

export type LLMProvider = 'openai' | 'claude' | 'gemini' | 'custom';
