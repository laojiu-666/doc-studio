<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    title="设置"
    style="width: 600px; max-width: 90vw;"
    :bordered="false"
    :segmented="{ content: true }"
  >
    <n-tabs type="line" animated>
      <n-tab-pane name="api-keys" tab="API Keys">
        <div class="space-y-6">
          <!-- Add New Key Form -->
          <n-card title="添加 API Key" size="small">
            <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" label-width="100">
              <n-form-item label="提供商" path="provider">
                <n-select
                  v-model:value="formData.provider"
                  :options="providerOptions"
                  placeholder="选择 LLM 提供商"
                />
              </n-form-item>
              <n-form-item label="API Key" path="key">
                <n-input
                  v-model:value="formData.key"
                  type="password"
                  show-password-on="click"
                  placeholder="输入 API Key"
                />
              </n-form-item>
              <n-form-item v-if="formData.provider === 'custom' || showBaseUrl" label="Base URL" path="baseUrl">
                <n-input
                  v-model:value="formData.baseUrl"
                  placeholder="https://api.example.com/v1"
                />
              </n-form-item>
              <n-form-item v-if="formData.provider !== 'custom'" label=" ">
                <n-checkbox v-model:checked="showBaseUrl">自定义 Base URL</n-checkbox>
              </n-form-item>
              <n-form-item label=" ">
                <n-button type="primary" :loading="apiKeyStore.loading" @click="handleAdd">
                  添加
                </n-button>
              </n-form-item>
            </n-form>
          </n-card>

          <!-- API Key List -->
          <n-card title="已配置的 API Keys" size="small">
            <n-spin :show="apiKeyStore.loading">
              <div v-if="apiKeyStore.apiKeys.length === 0" class="text-center py-8 text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <p>暂无 API Key</p>
                <p class="text-sm">添加一个 API Key 以开始使用 AI 功能</p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="key in apiKeyStore.apiKeys"
                  :key="key.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <n-tag :type="getProviderType(key.provider)" size="small">
                      {{ getProviderLabel(key.provider) }}
                    </n-tag>
                    <div>
                      <div class="font-mono text-sm text-gray-600">{{ key.key }}</div>
                      <div v-if="key.baseUrl" class="text-xs text-gray-400">{{ key.baseUrl }}</div>
                    </div>
                  </div>
                  <n-popconfirm @positive-click="handleDelete(key.id)">
                    <template #trigger>
                      <n-button text type="error" size="small">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </n-button>
                    </template>
                    确定要删除这个 API Key 吗？
                  </n-popconfirm>
                </div>
              </div>
            </n-spin>
          </n-card>
        </div>
      </n-tab-pane>
    </n-tabs>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import {
  NModal,
  NTabs,
  NTabPane,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NButton,
  NTag,
  NSpin,
  NPopconfirm,
  NCheckbox,
  useMessage,
  type FormInst,
  type FormRules,
} from 'naive-ui';
import { useApiKeyStore } from '../../stores/api-key';
import type { CreateApiKeyDto } from '../../api/api-key';

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{ 'update:show': [value: boolean] }>();

const showModal = ref(props.show);
const apiKeyStore = useApiKeyStore();
const message = useMessage();
const formRef = ref<FormInst | null>(null);
const showBaseUrl = ref(false);

const formData = ref<CreateApiKeyDto>({
  provider: 'openai',
  key: '',
  baseUrl: '',
});

const providerOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Claude (Anthropic)', value: 'claude' },
  { label: 'Gemini (Google)', value: 'gemini' },
  { label: '自定义 (Custom)', value: 'custom' },
];

const rules: FormRules = {
  provider: { required: true, message: '请选择提供商' },
  key: { required: true, message: '请输入 API Key' },
  baseUrl: {
    required: false,
    validator: (_rule, value) => {
      if (formData.value.provider === 'custom' && !value) {
        return new Error('自定义提供商需要填写 Base URL');
      }
      if (value && !value.startsWith('http')) {
        return new Error('请输入有效的 URL');
      }
      return true;
    },
  },
};

function getProviderLabel(provider: string) {
  const map: Record<string, string> = {
    openai: 'OpenAI',
    claude: 'Claude',
    gemini: 'Gemini',
    custom: 'Custom',
  };
  return map[provider] || provider;
}

function getProviderType(provider: string): 'success' | 'info' | 'warning' | 'error' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    openai: 'success',
    claude: 'warning',
    gemini: 'info',
    custom: 'error',
  };
  return map[provider] || 'info';
}

async function handleAdd() {
  try {
    await formRef.value?.validate();
    const dto: CreateApiKeyDto = {
      provider: formData.value.provider,
      key: formData.value.key,
      baseUrl: (showBaseUrl.value || formData.value.provider === 'custom') ? formData.value.baseUrl : undefined,
    };
    const success = await apiKeyStore.addApiKey(dto);
    if (success) {
      message.success('API Key 添加成功');
      formData.value = { provider: 'openai', key: '', baseUrl: '' };
      showBaseUrl.value = false;
    } else {
      message.error(apiKeyStore.error || '添加失败');
    }
  } catch {
    // Validation failed
  }
}

async function handleDelete(id: string) {
  const success = await apiKeyStore.deleteApiKey(id);
  if (success) {
    message.success('API Key 已删除');
  } else {
    message.error(apiKeyStore.error || '删除失败');
  }
}

watch(() => props.show, (val) => {
  showModal.value = val;
  if (val) {
    apiKeyStore.fetchApiKeys();
  }
});

watch(showModal, (val) => {
  emit('update:show', val);
});

onMounted(() => {
  if (props.show) {
    apiKeyStore.fetchApiKeys();
  }
});
</script>
