import { PrismaService } from '../../prisma.service';
import { LLMService } from '../llm/llm.service';
import { DocumentsService } from '../documents/documents.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class ChatService {
    private prisma;
    private llmService;
    private documentsService;
    constructor(prisma: PrismaService, llmService: LLMService, documentsService: DocumentsService);
    getOrCreateChat(documentId: string, userId: string): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            content: string;
            role: string;
            chatId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        documentId: string;
    }>;
    getMessages(documentId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        role: string;
        chatId: string;
    }[]>;
    sendMessage(documentId: string, userId: string, dto: SendMessageDto): AsyncGenerator<string, void, unknown>;
}
