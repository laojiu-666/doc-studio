import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Mask the keys for security
    return keys.map((k) => ({
      ...k,
      key: k.key.slice(0, 8) + '...' + k.key.slice(-4),
    }));
  }

  async create(dto: CreateApiKeyDto, userId: string) {
    return this.prisma.apiKey.create({
      data: {
        provider: dto.provider,
        key: dto.key,
        baseUrl: dto.baseUrl,
        userId,
      },
    });
  }

  async remove(id: string, userId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    return this.prisma.apiKey.delete({
      where: { id },
    });
  }
}
