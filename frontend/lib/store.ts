import { create } from 'zustand';
import { api } from './api';

interface User {
  id: string;
  email: string;
  username: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, passwordConfirm: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const data = await api.login(email, password);
    set({ user: data.user, isAuthenticated: true });
  },

  register: async (email, username, password, passwordConfirm) => {
    const data = await api.register(email, username, password, passwordConfirm);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    await api.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = api.getToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      api.setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
