import { PrismaService } from '../../prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
export declare class ApiKeysService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        key: string;
        id: string;
        createdAt: Date;
        userId: string;
        provider: string;
        baseUrl: string | null;
    }[]>;
    create(dto: CreateApiKeyDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        provider: string;
        key: string;
        baseUrl: string | null;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        provider: string;
        key: string;
        baseUrl: string | null;
    }>;
}
