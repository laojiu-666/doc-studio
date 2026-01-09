"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const llm_service_1 = require("../llm/llm.service");
const documents_service_1 = require("../documents/documents.service");
let ChatService = class ChatService {
    prisma;
    llmService;
    documentsService;
    constructor(prisma, llmService, documentsService) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.documentsService = documentsService;
    }
    async getOrCreateChat(documentId, userId) {
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
    async getMessages(documentId, userId) {
        await this.documentsService.findOne(documentId, userId);
        return this.prisma.message.findMany({
            where: { chat: { documentId } },
            orderBy: { createdAt: 'asc' },
        });
    }
    async *sendMessage(documentId, userId, dto) {
        const chat = await this.getOrCreateChat(documentId, userId);
        const docContent = await this.documentsService.getContent(documentId, userId);
        await this.prisma.message.create({
            data: {
                role: 'user',
                content: dto.content,
                chatId: chat.id,
            },
        });
        const history = await this.getMessages(documentId, userId);
        const messages = [
            {
                role: 'system',
                content: `You are a helpful assistant for document editing. The user is working with the following document:\n\n${docContent}\n\nHelp them with writing, editing, and improving the document content.`,
            },
            ...history.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        ];
        let fullResponse = '';
        for await (const chunk of this.llmService.chat(userId, messages, dto.provider)) {
            fullResponse += chunk;
            yield chunk;
        }
        await this.prisma.message.create({
            data: {
                role: 'assistant',
                content: fullResponse,
                chatId: chat.id,
            },
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LLMService,
        documents_service_1.DocumentsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map