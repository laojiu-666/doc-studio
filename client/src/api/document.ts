import api from './index';
import type { Document } from '../types';

export const documentApi = {
  list: () => api.get<Document[]>('/documents'),

  upload: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },

  getOne: (id: string) => api.get<Document>(`/documents/${id}`),

  getPreviewUrl: (id: string) => `/api/documents/${id}/preview`,

  getExportUrl: (id: string) => `/api/documents/${id}/export`,

  delete: (id: string) => api.delete(`/documents/${id}`),
};
