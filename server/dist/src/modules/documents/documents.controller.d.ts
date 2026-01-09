import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
export declare class DocumentsController {
    private documentsService;
    constructor(documentsService: DocumentsService);
    upload(file: Express.Multer.File, user: any): Promise<{
        path: string;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        size: number;
        userId: string;
    }>;
    findAll(user: any): Promise<{
        path: string;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        size: number;
        userId: string;
    }[]>;
    findOne(id: string, user: any): Promise<{
        path: string;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        size: number;
        userId: string;
    }>;
    preview(id: string, user: any, res: Response): Promise<StreamableFile>;
    export(id: string, user: any, res: Response): Promise<StreamableFile>;
    remove(id: string, user: any): Promise<{
        path: string;
        id: string;
        createdAt: Date;
        name: string;
        type: string;
        size: number;
        userId: string;
    }>;
}
