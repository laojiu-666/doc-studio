import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
export declare class ApiKeysController {
    private apiKeysService;
    constructor(apiKeysService: ApiKeysService);
    findAll(user: any): Promise<{
        key: string;
        id: string;
        createdAt: Date;
        userId: string;
        provider: string;
        baseUrl: string | null;
    }[]>;
    create(dto: CreateApiKeyDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        provider: string;
        key: string;
        baseUrl: string | null;
    }>;
    remove(id: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        provider: string;
        key: string;
        baseUrl: string | null;
    }>;
}
