<template>
  <div
    class="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-blue-50"
    role="region"
    aria-label="文件上传区域"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <div
      class="w-full max-w-xl p-10 bg-white border-2 border-dashed rounded-2xl text-center transition-all duration-300 shadow-sm hover:shadow-md"
      :class="isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-gray-200'"
      tabindex="0"
      role="button"
      aria-label="拖拽文件到此处或点击选择文件"
      @keydown.enter="triggerUpload"
      @keydown.space.prevent="triggerUpload"
    >
      <!-- Icon -->
      <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <h2 class="text-2xl font-bold text-gray-800 mb-2">上传文档</h2>
      <p class="text-gray-500 mb-6">支持 PDF、Word、Excel、CSV、TXT 格式</p>

      <n-upload
        ref="uploadRef"
        :show-file-list="false"
        :custom-request="handleUpload"
        accept=".pdf,.docx,.xlsx,.csv,.txt"
      >
        <n-button type="primary" size="large" class="px-8">
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          选择文件
        </n-button>
      </n-upload>

      <div class="mt-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        <span>或拖拽文件到此处</span>
      </div>

      <!-- Upload Progress -->
      <div v-if="documentStore.uploadStatus === 'uploading'" class="mt-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">正在上传...</span>
          <span class="text-sm font-medium text-blue-600">{{ documentStore.uploadProgress }}%</span>
        </div>
        <n-progress
          type="line"
          :percentage="documentStore.uploadProgress"
          :show-indicator="false"
          :height="8"
          :border-radius="4"
          aria-label="上传进度"
        />
      </div>
    </div>

    <!-- Supported Formats -->
    <div class="mt-8 flex items-center gap-4">
      <div v-for="format in formats" :key="format.ext" class="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm">
        <div class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" :class="format.color">
          {{ format.ext }}
        </div>
        <span class="text-xs text-gray-500">{{ format.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NUpload, NButton, NProgress, type UploadCustomRequestOptions } from 'naive-ui';
import { useDocumentStore } from '../../../stores/document';

const emit = defineEmits<{ uploaded: [doc: any] }>();

const documentStore = useDocumentStore();
const isDragging = ref(false);
const uploadRef = ref<InstanceType<typeof NUpload>>();

const formats = [
  { ext: 'PDF', name: 'PDF 文档', color: 'bg-red-100 text-red-600' },
  { ext: 'DOC', name: 'Word', color: 'bg-blue-100 text-blue-600' },
  { ext: 'XLS', name: 'Excel', color: 'bg-green-100 text-green-600' },
  { ext: 'TXT', name: '文本', color: 'bg-gray-100 text-gray-600' },
];

function triggerUpload() {
  uploadRef.value?.$el.querySelector('input')?.click();
}

async function handleUpload(options: UploadCustomRequestOptions) {
  const file = options.file.file;
  if (!file) return;
  const doc = await documentStore.uploadFile(file);
  emit('uploaded', doc);
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) {
    const doc = await documentStore.uploadFile(file);
    emit('uploaded', doc);
  }
}
</script>
