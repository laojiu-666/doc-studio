import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { LLMService } from '../llm/llm.service';
import { DocumentsService } from '../documents/documents.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatMessage } from '../llm/llm.interface';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private llmService: LLMService,
    private documentsService: DocumentsService,
  ) {}

  async getOrCreateChat(documentId: string, userId: string) {
    await this.documentsService.findOne(documentId, userId);

    let chat = await this.prisma.chat.findFirst({
      where: { documentId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: { documentId },
        include: { messages: true },
      });
    }

    return chat;
  }

  async getMessages(documentId: string, userId: string) {
    await this.documentsService.findOne(documentId, userId);

    return this.prisma.message.findMany({
      where: { chat: { documentId } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async *sendMessage(documentId: string, userId: string, dto: SendMessageDto) {
    const chat = await this.getOrCreateChat(documentId, userId);
    const docContent = await this.documentsService.getContent(documentId, userId);

    // Save user message
    await this.prisma.message.create({
      data: {
        role: 'user',
        content: dto.content,
        chatId: chat.id,
      },
    });

    // Build messages for LLM
    const history = await this.getMessages(documentId, userId);
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful assistant for document editing. The user is working with the following document:\n\n${docContent}\n\nHelp them with writing, editing, and improving the document content.`,
      },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Stream response
    let fullResponse = '';

    for await (const chunk of this.llmService.chat(userId, messages, dto.provider)) {
      fullResponse += chunk;
      yield chunk;
    }

    // Save assistant message
    await this.prisma.message.create({
      data: {
        role: 'assistant',
        content: fullResponse,
        chatId: chat.id,
      },
    });
  }
}
