<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <!-- Header -->
    <header class="h-16 bg-white border-b shadow-sm flex items-center justify-between px-6">
      <!-- Left: Logo -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-800">Doc Studio</h1>
          <p v-if="currentDoc" class="text-xs text-gray-400 truncate max-w-[200px]">{{ currentDoc.name }}</p>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-3">
        <n-button v-if="currentDoc" secondary @click="handleExport">
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </template>
          导出
        </n-button>

        <n-button quaternary circle @click="showSettings = true">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </n-button>

        <n-dropdown :options="userOptions" @select="handleUserAction">
          <n-button quaternary class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="text-sm font-medium text-blue-600">{{ userInitial }}</span>
            </div>
            <span class="text-gray-700">{{ authStore.user?.email }}</span>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </n-button>
        </n-dropdown>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Document Panel -->
      <div
        class="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        :style="{ width: appStore.isChatPanelOpen ? '70%' : '100%' }"
      >
        <UploadZone v-if="!currentDoc" @uploaded="handleUploaded" />
        <DocumentPreview v-else :document="currentDoc" />
      </div>

      <!-- Chat Panel -->
      <div
        v-if="appStore.isChatPanelOpen"
        class="w-[30%] min-w-[320px] max-w-[480px] border-l shadow-lg flex flex-col transition-all duration-300"
      >
        <ChatPanel v-if="currentDoc" :document-id="currentDoc.id" />
        <div v-else class="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
          <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">请先上传文档</h3>
          <p class="text-sm text-gray-500">上传文档后即可开始 AI 对话</p>
        </div>
      </div>
    </div>

    <!-- Toggle Chat Button -->
    <n-tooltip placement="left">
      <template #trigger>
        <n-button
          circle
          type="primary"
          size="large"
          class="fixed bottom-6 right-6 shadow-lg"
          @click="appStore.toggleChatPanel"
        >
          <svg v-if="appStore.isChatPanelOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </n-button>
      </template>
      {{ appStore.isChatPanelOpen ? '收起对话' : '展开对话' }}
    </n-tooltip>

    <!-- Settings Modal -->
    <SettingsModal v-model:show="showSettings" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NDropdown, NTooltip } from 'naive-ui';
import { useAuthStore } from '../../stores/auth';
import { useDocumentStore } from '../../stores/document';
import { useAppStore } from '../../stores/app';
import UploadZone from './components/UploadZone.vue';
import DocumentPreview from './components/DocumentPreview.vue';
import ChatPanel from './components/ChatPanel.vue';
import SettingsModal from '../../components/settings/SettingsModal.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const documentStore = useDocumentStore();
const appStore = useAppStore();

const showSettings = ref(false);
const currentDoc = computed(() => documentStore.currentDoc);
const userInitial = computed(() => authStore.user?.email?.charAt(0).toUpperCase() || 'U');

const userOptions = [
  {
    label: '设置',
    key: 'settings',
    icon: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
    ]),
  },
  { type: 'divider', key: 'd1' },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' }),
    ]),
  },
];

import { h } from 'vue';

onMounted(async () => {
  await authStore.fetchUser();
  if (route.params.id) {
    await documentStore.loadDocument(route.params.id as string);
  }
});

function handleUploaded(doc: any) {
  router.push(`/doc/${doc.id}`);
}

function handleExport() {
  if (currentDoc.value) {
    const url = documentStore.getExportUrl(currentDoc.value.id);
    const token = localStorage.getItem('token');
    window.open(`${url}?token=${token}`, '_blank');
  }
}

function handleUserAction(key: string) {
  if (key === 'logout') {
    authStore.logout();
    router.push('/login');
  } else if (key === 'settings') {
    showSettings.value = true;
  }
}
</script>
