import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { LLMAdapter, LLMProvider, ChatMessage } from './llm.interface';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { ClaudeAdapter } from './adapters/claude.adapter';
import { GeminiAdapter } from './adapters/gemini.adapter';
import { CustomAdapter } from './adapters/custom.adapter';

@Injectable()
export class LLMService {
  constructor(private prisma: PrismaService) {}

  async getAdapter(userId: string, provider?: LLMProvider): Promise<LLMAdapter> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        userId,
        ...(provider && { provider }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!apiKey) {
      throw new Error('No API key configured');
    }

    return this.createAdapter(
      apiKey.provider as LLMProvider,
      apiKey.key,
      apiKey.baseUrl || undefined,
    );
  }

  createAdapter(provider: LLMProvider, apiKey: string, baseUrl?: string): LLMAdapter {
    switch (provider) {
      case 'openai':
        return new OpenAIAdapter(apiKey, baseUrl);
      case 'claude':
        return new ClaudeAdapter(apiKey, baseUrl);
      case 'gemini':
        return new GeminiAdapter(apiKey, baseUrl);
      case 'custom':
        if (!baseUrl) throw new Error('Custom provider requires baseUrl');
        return new CustomAdapter(apiKey, baseUrl);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  async *chat(
    userId: string,
    messages: ChatMessage[],
    provider?: LLMProvider,
  ): AsyncIterable<string> {
    const adapter = await this.getAdapter(userId, provider);
    yield* adapter.chat(messages, true);
  }
}
