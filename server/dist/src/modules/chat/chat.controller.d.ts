import type { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    getChat(documentId: string, user: any): Promise<{
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
    getMessages(documentId: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        role: string;
        chatId: string;
    }[]>;
    sendMessage(documentId: string, dto: SendMessageDto, user: any, res: Response): Promise<void>;
}
