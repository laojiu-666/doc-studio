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
exports.LLMService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const openai_adapter_1 = require("./adapters/openai.adapter");
const claude_adapter_1 = require("./adapters/claude.adapter");
const gemini_adapter_1 = require("./adapters/gemini.adapter");
const custom_adapter_1 = require("./adapters/custom.adapter");
let LLMService = class LLMService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAdapter(userId, provider) {
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
        return this.createAdapter(apiKey.provider, apiKey.key, apiKey.baseUrl || undefined);
    }
    createAdapter(provider, apiKey, baseUrl) {
        switch (provider) {
            case 'openai':
                return new openai_adapter_1.OpenAIAdapter(apiKey, baseUrl);
            case 'claude':
                return new claude_adapter_1.ClaudeAdapter(apiKey, baseUrl);
            case 'gemini':
                return new gemini_adapter_1.GeminiAdapter(apiKey, baseUrl);
            case 'custom':
                if (!baseUrl)
                    throw new Error('Custom provider requires baseUrl');
                return new custom_adapter_1.CustomAdapter(apiKey, baseUrl);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }
    async *chat(userId, messages, provider) {
        const adapter = await this.getAdapter(userId, provider);
        yield* adapter.chat(messages, true);
    }
};
exports.LLMService = LLMService;
exports.LLMService = LLMService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LLMService);
//# sourceMappingURL=llm.service.js.map