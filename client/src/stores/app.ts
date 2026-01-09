import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const isChatPanelOpen = ref(true);
  const splitRatio = ref(0.7);

  function toggleChatPanel() {
    isChatPanelOpen.value = !isChatPanelOpen.value;
  }

  return { isChatPanelOpen, splitRatio, toggleChatPanel };
});
