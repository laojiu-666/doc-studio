import { defineStore } from 'pinia';
import { ref } from 'vue';
import { documentApi } from '../api/document';
import type { Document } from '../types';

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<Document[]>([]);
  const currentDoc = ref<Document | null>(null);
  const uploadProgress = ref(0);
  const uploadStatus = ref<'idle' | 'uploading' | 'success' | 'error'>('idle');

  async function fetchDocuments() {
    const { data } = await documentApi.list();
    documents.value = data;
  }

  async function uploadFile(file: File) {
    uploadStatus.value = 'uploading';
    uploadProgress.value = 0;

    try {
      const { data } = await documentApi.upload(file, (progress) => {
        uploadProgress.value = progress;
      });
      documents.value.unshift(data);
      currentDoc.value = data;
      uploadStatus.value = 'success';
      return data;
    } catch (e) {
      uploadStatus.value = 'error';
      throw e;
    }
  }

  async function loadDocument(id: string) {
    const { data } = await documentApi.getOne(id);
    currentDoc.value = data;
  }

  async function deleteDocument(id: string) {
    await documentApi.delete(id);
    documents.value = documents.value.filter((d) => d.id !== id);
    if (currentDoc.value?.id === id) {
      currentDoc.value = null;
    }
  }

  function getPreviewUrl(id: string) {
    return documentApi.getPreviewUrl(id);
  }

  function getExportUrl(id: string) {
    return documentApi.getExportUrl(id);
  }

  return {
    documents,
    currentDoc,
    uploadProgress,
    uploadStatus,
    fetchDocuments,
    uploadFile,
    loadDocument,
    deleteDocument,
    getPreviewUrl,
    getExportUrl,
  };
});
