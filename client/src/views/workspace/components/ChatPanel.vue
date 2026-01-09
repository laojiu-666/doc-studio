<template>
  <div class="flex flex-col h-full bg-white" role="complementary" aria-label="AI 对话面板">
    <!-- Header -->
    <div class="h-14 border-b flex items-center justify-between px-4 bg-gradient-to-r from-blue-600 to-blue-700">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <span class="font-semibold text-white">AI 助手</span>
      </div>
      <n-button text size="small" class="text-white/80 hover:text-white" aria-label="清空对话历史" @click="chatStore.clearMessages">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </n-button>
    </div>

    <!-- Messages -->
    <div
      ref="messagesRef"
      class="flex-1 overflow-auto p-4 space-y-4 bg-gray-50"
      role="log"
      aria-live="polite"
      aria-label="对话消息列表"
    >
      <!-- Empty State -->
      <div v-if="chatStore.messages.length === 0 && !chatStore.isStreaming" class="flex flex-col items-center justify-center h-full text-center">
        <div class="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">开始对话</h3>
        <p class="text-sm text-gray-500 mb-4">向 AI 助手提问，获取文档相关帮助</p>
        <div class="flex flex-wrap gap-2 justify-center">
          <n-tag v-for="tag in quickTags" :key="tag" size="small" round class="cursor-pointer hover:bg-blue-50" @click="quickAction(tag)">
            {{ tag }}
          </n-tag>
        </div>
      </div>

      <!-- Message List -->
      <template v-else>
        <div
          v-for="msg in chatStore.messages"
          :key="msg.id"
          class="flex gap-3"
          :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
          :aria-label="msg.role === 'user' ? '用户消息' : 'AI 回复'"
        >
          <!-- Avatar -->
          <div
            class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
            :class="msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'"
          >
            <svg v-if="msg.role === 'user'" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <svg v-else class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <!-- Message Bubble -->
          <div
            class="max-w-[75%] px-4 py-3 rounded-2xl shadow-sm"
            :class="msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white rounded-bl-md'"
          >
            <div v-if="msg.role === 'assistant'" class="prose prose-sm max-w-none" v-html="renderMarkdown(msg.content)" />
            <div v-else class="text-sm">{{ msg.content }}</div>
          </div>
        </div>

        <!-- Streaming Indicator -->
        <div v-if="chatStore.isStreaming" class="flex gap-3" aria-label="AI 正在回复">
          <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Input -->
    <div class="border-t p-4 bg-white">
      <div class="flex gap-3 items-end">
        <n-input
          v-model:value="input"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 4 }"
          placeholder="输入消息，按 Enter 发送..."
          class="flex-1"
          aria-label="消息输入框"
          @keydown.enter.exact.prevent="handleSend"
        />
        <n-button
          type="primary"
          :disabled="!input.trim() || chatStore.isStreaming"
          class="h-10 w-10 !p-0"
          aria-label="发送消息"
          @click="handleSend"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </n-button>
      </div>
      <div class="mt-3 flex gap-2" role="group" aria-label="快捷操作">
        <n-button v-for="action in quickActions" :key="action" size="small" secondary round @click="quickAction(action)">
          {{ action }}
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { NButton, NInput, NTag } from 'naive-ui';
import MarkdownIt from 'markdown-it';
import { useChatStore } from '../../../stores/chat';

const props = defineProps<{ documentId: string }>();

const chatStore = useChatStore();
const input = ref('');
const messagesRef = ref<HTMLElement>();

const md = new MarkdownIt();

const quickTags = ['总结文档', '提取要点', '翻译内容', '改写润色'];
const quickActions = ['续写', '改写', '总结', '翻译'];

function renderMarkdown(content: string) {
  return md.render(content);
}

async function handleSend() {
  if (!input.value.trim() || chatStore.isStreaming) return;
  const content = input.value;
  input.value = '';
  await chatStore.sendMessage(content);
}

function quickAction(action: string) {
  input.value = `请帮我${action}这篇文档的内容`;
  handleSend();
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

onMounted(() => {
  chatStore.loadMessages(props.documentId);
});

watch(() => props.documentId, (id) => {
  chatStore.loadMessages(id);
});

watch(() => chatStore.messages.length, scrollToBottom);
watch(() => chatStore.messages[chatStore.messages.length - 1]?.content, scrollToBottom);
</script>

<style scoped>
.prose :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}
.prose :deep(code) {
  background: #f1f5f9;
  color: #0f172a;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}
.prose :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}
.prose :deep(p) {
  margin: 0.5rem 0;
}
.prose :deep(ul), .prose :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}
</style>
