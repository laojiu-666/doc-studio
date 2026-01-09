<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-96">
      <h1 class="text-2xl font-bold mb-6 text-center">登录</h1>
      <n-form ref="formRef" :model="form" :rules="rules">
        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="form.email" placeholder="请输入邮箱" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="form.password" type="password" placeholder="请输入密码" />
        </n-form-item>
        <n-button type="primary" block :loading="loading" @click="handleSubmit">
          登录
        </n-button>
      </n-form>
      <p class="mt-4 text-center text-gray-600">
        没有账号？<router-link to="/register" class="text-blue-500">注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const message = useMessage();

const loading = ref(false);
const form = reactive({ email: '', password: '' });
const rules = {
  email: { required: true, message: '请输入邮箱' },
  password: { required: true, message: '请输入密码' },
};

async function handleSubmit() {
  loading.value = true;
  try {
    await authStore.login(form.email, form.password);
    router.push('/');
  } catch (e: any) {
    message.error(e.response?.data?.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>
