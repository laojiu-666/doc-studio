import { PrismaService } from '../../prisma.service';
import { LLMAdapter, LLMProvider, ChatMessage } from './llm.interface';
export declare class LLMService {
    private prisma;
    constructor(prisma: PrismaService);
    getAdapter(userId: string, provider?: LLMProvider): Promise<LLMAdapter>;
    createAdapter(provider: LLMProvider, apiKey: string, baseUrl?: string): LLMAdapter;
    chat(userId: string, messages: ChatMessage[], provider?: LLMProvider): AsyncIterable<string>;
}
