import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api/auth';
import type { User } from '../types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isAuthenticated = computed(() => !!token.value);

  async function login(email: string, password: string) {
    const { data } = await authApi.login(email, password);
    token.value = data.access_token;
    user.value = data.user;
    localStorage.setItem('token', data.access_token);
  }

  async function register(email: string, password: string) {
    const { data } = await authApi.register(email, password);
    token.value = data.access_token;
    user.value = data.user;
    localStorage.setItem('token', data.access_token);
  }

  async function fetchUser() {
    if (!token.value) return;
    try {
      const { data } = await authApi.getMe();
      user.value = data;
    } catch {
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }

  return { user, token, isAuthenticated, login, register, fetchUser, logout };
});
