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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const MIME_TYPES = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
};
let DocumentsService = class DocumentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(file, userId) {
        const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
        return this.prisma.document.create({
            data: {
                name: file.originalname,
                type: ext,
                path: file.path,
                size: file.size,
                userId,
            },
        });
    }
    async findAll(userId) {
        return this.prisma.document.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, userId) {
        const doc = await this.prisma.document.findFirst({
            where: { id, userId },
        });
        if (!doc) {
            throw new common_1.NotFoundException('Document not found');
        }
        return doc;
    }
    async getPreview(id, userId) {
        const doc = await this.findOne(id, userId);
        const stream = (0, fs_1.createReadStream)(doc.path);
        const mimeType = MIME_TYPES[doc.type] || 'application/octet-stream';
        return { stream, mimeType, filename: doc.name };
    }
    async export(id, userId) {
        const doc = await this.findOne(id, userId);
        const stream = (0, fs_1.createReadStream)(doc.path);
        const mimeType = MIME_TYPES[doc.type] || 'application/octet-stream';
        return { stream, mimeType, filename: doc.name };
    }
    async remove(id, userId) {
        const doc = await this.findOne(id, userId);
        try {
            await (0, promises_1.unlink)(doc.path);
        }
        catch (e) {
        }
        return this.prisma.document.delete({
            where: { id },
        });
    }
    async getContent(id, userId) {
        const doc = await this.findOne(id, userId);
        const fs = await import('fs/promises');
        if (doc.type === 'txt' || doc.type === 'csv') {
            return fs.readFile(doc.path, 'utf-8');
        }
        return `[Document: ${doc.name}]`;
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map