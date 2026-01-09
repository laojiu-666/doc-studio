import { PrismaService } from '../../prisma.service';
export declare class DocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(file: Express.Multer.File, userId: string): Promise<{
        path: string;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        size: number;
        userId: string;
    }>;
    findAll(userId: string): Promise<{
        path: string;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        size: number;
        userId: string;
    }[]>;
    findOne(id: string, userId: string): Promise<{
        path: string;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        size: number;
        userId: string;
    }>;
    getPreview(id: string, userId: string): Promise<{
        stream: import("fs").ReadStream;
        mimeType: string;
        filename: string;
    }>;
    export(id: string, userId: string): Promise<{
        stream: import("fs").ReadStream;
        mimeType: string;
        filename: string;
    }>;
    remove(id: string, userId: string): Promise<{
        path: string;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        size: number;
        userId: string;
    }>;
    getContent(id: string, userId: string): Promise<string>;
}
