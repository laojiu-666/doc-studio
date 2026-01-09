import type { LLMProvider } from '../../llm/llm.interface';
export declare class SendMessageDto {
    content: string;
    provider?: LLMProvider;
}
