/**
 * API client for Django backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken(): string | null {
    if (this.accessToken) return this.accessToken;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestOptions & { skipAuth?: boolean } = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, skipAuth = false } = options;

    if (!skipAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{
      user: any;
      tokens: { access: string; refresh: string };
    }>('/auth/login/', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    });
    this.setToken(data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    return data;
  }

  async register(email: string, username: string, password: string, passwordConfirm: string) {
    const data = await this.request<{
      user: any;
      tokens: { access: string; refresh: string };
    }>('/auth/register/', {
      method: 'POST',
      body: { email, username, password, password_confirm: passwordConfirm },
      skipAuth: true,
    });
    this.setToken(data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    return data;
  }

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await this.request('/auth/logout/', {
        method: 'POST',
        body: { refresh: refreshToken },
      });
    } finally {
      this.setToken(null);
      localStorage.removeItem('refresh_token');
    }
  }

  async getMe() {
    return this.request<any>('/auth/me/');
  }

  // Documents
  async getDocuments() {
    return this.request<any[]>('/documents/');
  }

  async getDocument(id: string) {
    return this.request<any>(`/documents/${id}/`);
  }

  async uploadDocument(file: File, title?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return this.request<any>('/documents/', {
      method: 'POST',
      body: formData,
    });
  }

  async updateDocument(id: string, data: { title?: string; content_html?: string }) {
    return this.request<any>(`/documents/${id}/`, {
      method: 'PATCH',
      body: data,
    });
  }

  async deleteDocument(id: string) {
    return this.request<void>(`/documents/${id}/`, { method: 'DELETE' });
  }

  async exportDocument(id: string) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/documents/${id}/export/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.blob();
  }

  getDocumentPreviewUrl(id: string): string {
    return `${API_URL}/documents/${id}/preview/`;
  }

  // API Keys
  async getApiKeys() {
    return this.request<any[]>('/llm/api-keys/');
  }

  async createApiKey(data: {
    name: string;
    provider_id: string;
    api_key: string;
    base_url?: string;
    model: string;
  }) {
    return this.request<any>('/llm/api-keys/', {
      method: 'POST',
      body: data,
    });
  }

  async updateApiKey(id: string, data: {
    name?: string;
    provider_id?: string;
    api_key?: string;
    base_url?: string;
    model?: string;
  }) {
    return this.request<any>(`/llm/api-keys/${id}/`, {
      method: 'PATCH',
      body: data,
    });
  }

  async deleteApiKey(id: string) {
    return this.request<void>(`/llm/api-keys/${id}/`, { method: 'DELETE' });
  }

  async testApiKey(id: string) {
    return this.request<{ success: boolean; message?: string; error?: string }>(
      `/llm/api-keys/${id}/test/`,
      { method: 'POST' }
    );
  }

  // LLM Providers (for regular users)
  async getProviders() {
    return this.request<any[]>('/llm/providers/');
  }

  // Admin: Provider Management
  async adminGetProviders() {
    return this.request<any[]>('/llm/admin/providers/');
  }

  async adminInitializeProviders() {
    return this.request<{ success: boolean; message: string }>(
      '/llm/admin/providers/initialize/',
      { method: 'POST' }
    );
  }

  async adminSyncModels(providerId: string, apiKey: string) {
    return this.request<{ success: boolean; message: string; models_count?: number }>(
      `/llm/admin/providers/${providerId}/sync_models/`,
      { method: 'POST', body: { api_key: apiKey } }
    );
  }

  async adminResetToDefault(providerId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/llm/admin/providers/${providerId}/reset_to_default/`,
      { method: 'POST' }
    );
  }

  async adminSyncAllModels(apiKeys: Record<string, string>) {
    return this.request<{ success: boolean; results: Record<string, any> }>(
      '/llm/admin/sync-all/',
      { method: 'POST', body: { api_keys: apiKeys } }
    );
  }

  // Chat
  async getChatSessions(documentId?: string) {
    const query = documentId ? `?document=${documentId}` : '';
    return this.request<any[]>(`/chat/sessions/${query}`);
  }

  async createChatSession(documentId?: string, title?: string) {
    return this.request<any>('/chat/sessions/', {
      method: 'POST',
      body: { document: documentId, title: title || 'New Chat' },
    });
  }

  async getChatSession(id: string) {
    return this.request<any>(`/chat/sessions/${id}/`);
  }

  async deleteChatSession(id: string) {
    return this.request<void>(`/chat/sessions/${id}/`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
