import api from './index';
import type { User } from '../types';

export const authApi = {
  register: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/login', { email, password }),

  getMe: () => api.get<User>('/auth/me'),
};
