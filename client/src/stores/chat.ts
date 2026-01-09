import { defineStore } from 'pinia';
import { ref } from 'vue';
import { chatApi } from '../api/chat';
import type { Message, LLMProvider } from '../types';

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([]);
  const isStreaming = ref(false);
  const currentDocId = ref<string | null>(null);

  async function loadMessages(documentId: string) {
    currentDocId.value = documentId;
    messages.value = await chatApi.getMessages(documentId);
  }

  async function sendMessage(content: string, provider?: LLMProvider) {
    if (!currentDocId.value || isStreaming.value) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    messages.value.push(userMsg);

    // Add placeholder for assistant
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    messages.value.push(assistantMsg);

    isStreaming.value = true;

    try {
      for await (const chunk of chatApi.sendMessage(currentDocId.value, content, provider)) {
        assistantMsg.content += chunk;
      }
    } catch (e) {
      assistantMsg.content = 'Error: ' + (e as Error).message;
    } finally {
      isStreaming.value = false;
    }
  }

  function clearMessages() {
    messages.value = [];
  }

  return { messages, isStreaming, currentDocId, loadMessages, sendMessage, clearMessages };
});
