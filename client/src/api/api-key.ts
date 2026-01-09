import api from './index';

export interface ApiKey {
  id: string;
  provider: string;
  key: string;
  baseUrl: string | null;
  createdAt: string;
}

export interface CreateApiKeyDto {
  provider: 'openai' | 'claude' | 'gemini' | 'custom';
  key: string;
  baseUrl?: string;
}

export const apiKeyApi = {
  list: () => api.get<ApiKey[]>('/api-keys'),

  create: (dto: CreateApiKeyDto) => api.post<ApiKey>('/api-keys', dto),

  remove: (id: string) => api.delete(`/api-keys/${id}`),
};
