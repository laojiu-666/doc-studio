import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
};

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(file: Express.Multer.File, userId: string) {
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

  async findAll(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, userId },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    return doc;
  }

  async getPreview(id: string, userId: string) {
    const doc = await this.findOne(id, userId);
    const stream = createReadStream(doc.path);
    const mimeType = MIME_TYPES[doc.type] || 'application/octet-stream';

    return { stream, mimeType, filename: doc.name };
  }

  async export(id: string, userId: string) {
    const doc = await this.findOne(id, userId);
    const stream = createReadStream(doc.path);
    const mimeType = MIME_TYPES[doc.type] || 'application/octet-stream';

    return { stream, mimeType, filename: doc.name };
  }

  async remove(id: string, userId: string) {
    const doc = await this.findOne(id, userId);

    try {
      await unlink(doc.path);
    } catch (e) {
      // File might not exist
    }

    return this.prisma.document.delete({
      where: { id },
    });
  }

  async getContent(id: string, userId: string): Promise<string> {
    const doc = await this.findOne(id, userId);
    const fs = await import('fs/promises');

    if (doc.type === 'txt' || doc.type === 'csv') {
      return fs.readFile(doc.path, 'utf-8');
    }

    // For other formats, return a placeholder
    // In production, use libraries like mammoth for docx, pdf-parse for pdf
    return `[Document: ${doc.name}]`;
  }
}
