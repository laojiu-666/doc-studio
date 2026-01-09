import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiKeyApi, type ApiKey, type CreateApiKeyDto } from '../api/api-key';

export const useApiKeyStore = defineStore('apiKey', () => {
  const apiKeys = ref<ApiKey[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchApiKeys() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await apiKeyApi.list();
      apiKeys.value = data;
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || '获取 API Key 列表失败';
    } finally {
      loading.value = false;
    }
  }

  async function addApiKey(dto: CreateApiKeyDto) {
    loading.value = true;
    error.value = null;
    try {
      await apiKeyApi.create(dto);
      await fetchApiKeys();
      return true;
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || '添加 API Key 失败';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteApiKey(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await apiKeyApi.remove(id);
      await fetchApiKeys();
      return true;
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || '删除 API Key 失败';
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    apiKeys,
    loading,
    error,
    fetchApiKeys,
    addApiKey,
    deleteApiKey,
  };
});
