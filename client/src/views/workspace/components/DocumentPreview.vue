<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-gray-50">
    <!-- Toolbar -->
    <div class="h-12 bg-white border-b flex items-center justify-between px-4 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <span class="text-blue-600 text-sm font-medium">{{ getFileIcon() }}</span>
        </div>
        <div>
          <div class="font-medium text-gray-800">{{ document.name }}</div>
          <div class="text-xs text-gray-400">{{ formatSize(document.size) }}</div>
        </div>
      </div>
      <div v-if="document.type === 'pdf' && totalPages > 0" class="flex items-center gap-2">
        <n-button size="small" :disabled="currentPage <= 1" @click="currentPage--">
          上一页
        </n-button>
        <span class="text-sm text-gray-600">{{ currentPage }} / {{ totalPages }}</span>
        <n-button size="small" :disabled="currentPage >= totalPages" @click="currentPage++">
          下一页
        </n-button>
      </div>
    </div>

    <!-- Preview Area -->
    <div class="flex-1 overflow-auto">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center h-full">
        <n-spin size="large">
          <template #description>
            <span class="text-gray-500">正在加载文档...</span>
          </template>
        </n-spin>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex items-center justify-center h-full p-8">
        <n-result status="error" title="加载失败" :description="error">
          <template #footer>
            <n-button type="primary" @click="reload">重试</n-button>
          </template>
        </n-result>
      </div>

      <!-- PDF Preview -->
      <div v-else-if="document.type === 'pdf' && previewData" class="p-4">
        <div class="bg-white rounded-lg shadow-sm p-4 mx-auto" style="max-width: 900px;">
          <VuePdfEmbed
            :source="previewData"
            :page="currentPage"
            @loaded="handlePdfLoaded"
          />
        </div>
      </div>

      <!-- Word Preview -->
      <div v-else-if="document.type === 'docx' && previewData" class="p-4">
        <div class="bg-white rounded-lg shadow-sm mx-auto" style="max-width: 900px;">
          <VueOfficeDocx :src="previewData" />
        </div>
      </div>

      <!-- Excel Preview -->
      <div v-else-if="document.type === 'xlsx' && previewData" class="p-4">
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <VueOfficeExcel :src="previewData" />
        </div>
      </div>

      <!-- Text/CSV Preview -->
      <div v-else-if="['txt', 'csv'].includes(document.type) && previewData" class="p-4">
        <div class="bg-white rounded-lg shadow-sm p-6 mx-auto" style="max-width: 900px;">
          <pre class="whitespace-pre-wrap text-sm font-mono text-gray-700 leading-relaxed">{{ previewData }}</pre>
        </div>
      </div>

      <!-- Unsupported -->
      <div v-else-if="!loading" class="flex items-center justify-center h-full">
        <n-result status="info" title="暂不支持预览" description="此文件格式暂不支持在线预览">
          <template #footer>
            <n-button type="primary" @click="handleExport">下载文件</n-button>
          </template>
        </n-result>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { NButton, NSpin, NResult } from 'naive-ui';
import VuePdfEmbed from 'vue-pdf-embed';
import VueOfficeDocx from '@vue-office/docx';
import VueOfficeExcel from '@vue-office/excel';
import '@vue-office/docx/lib/index.css';
import '@vue-office/excel/lib/index.css';
import api from '../../../api';
import { useDocumentStore } from '../../../stores/document';
import type { Document } from '../../../types';

const props = defineProps<{ document: Document }>();

const documentStore = useDocumentStore();
const loading = ref(false);
const error = ref<string | null>(null);
const previewData = ref<ArrayBuffer | string | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);

function getFileIcon() {
  const icons: Record<string, string> = {
    pdf: 'PDF',
    docx: 'DOC',
    xlsx: 'XLS',
    txt: 'TXT',
    csv: 'CSV',
  };
  return icons[props.document.type] || 'FILE';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function loadPreview() {
  loading.value = true;
  error.value = null;
  previewData.value = null;
  currentPage.value = 1;
  totalPages.value = 0;

  try {
    const needsArrayBuffer = ['pdf', 'docx', 'xlsx'].includes(props.document.type);

    if (needsArrayBuffer) {
      const response = await api.get(`/documents/${props.document.id}/preview`, {
        responseType: 'arraybuffer',
      });
      previewData.value = response.data;
    } else if (['txt', 'csv'].includes(props.document.type)) {
      const response = await api.get(`/documents/${props.document.id}/preview`, {
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

function handlePdfLoaded(pdf: any) {
  totalPages.value = pdf.numPages || 0;
}

function handleExport() {
  const url = documentStore.getExportUrl(props.document.id);
  const token = localStorage.getItem('token');
  window.open(`${url}?token=${token}`, '_blank');
}

onMounted(loadPreview);
watch(() => props.document.id, loadPreview);
</script>
