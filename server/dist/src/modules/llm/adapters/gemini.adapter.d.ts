import { LLMAdapter, ChatMessage } from '../llm.interface';
export declare class GeminiAdapter implements LLMAdapter {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    chat(messages: ChatMessage[], stream: boolean): AsyncIterable<string>;
}
