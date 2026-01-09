import { ref, computed } from 'vue';
import api from '../api';
import type { Document } from '../types';

export function useDocumentPreview(document: () => Document | null) {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const previewData = ref<ArrayBuffer | string | null>(null);

  const doc = computed(() => document());

  async function loadPreview() {
    const currentDoc = doc.value;
    if (!currentDoc) return;

    loading.value = true;
    error.value = null;
    previewData.value = null;

    try {
      const needsArrayBuffer = ['pdf', 'docx', 'xlsx'].includes(currentDoc.type);

      if (needsArrayBuffer) {
        const response = await api.get(`/documents/${currentDoc.id}/preview`, {
          responseType: 'arraybuffer',
        });
        previewData.value = response.data;
      } else {
        // Text files can use text response
        const response = await api.get(`/documents/${currentDoc.id}/preview`, {
          responseType: 'text',
        });
        previewData.value = response.data;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || '加载预览失败';
    } finally {
      loading.value = false;
    }
  }

  function reload() {
    loadPreview();
  }

  return {
    loading,
    error,
    previewData,
    loadPreview,
    reload,
  };
}
