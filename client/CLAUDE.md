# Client - Vue 3 前端应用

> [← 返回根目录](../CLAUDE.md)

## 模块职责

Vue 3 + Vite 构建的单页应用，提供文档上传、预览、AI 对话和导出功能。

## 技术栈

- **框架**: Vue 3.5 + Composition API
- **构建**: Vite 7.2
- **UI**: Naive UI 2.43
- **样式**: Tailwind CSS 4.1
- **状态**: Pinia 3.0
- **路由**: Vue Router 4.6
- **HTTP**: Axios 1.13

## 目录结构

```
src/
├── api/                    # API 请求封装
│   ├── index.ts           # Axios 实例配置
│   ├── auth.ts            # 认证 API
│   ├── document.ts        # 文档 API
│   └── chat.ts            # 对话 API
├── components/
│   ├── common/            # 通用组件
│   └── business/          # 业务组件
├── hooks/                  # 组合式函数
├── layouts/                # 布局组件
├── router/
│   └── index.ts           # 路由配置 + 守卫
├── stores/                 # Pinia 状态管理
│   ├── auth.ts            # 认证状态
│   ├── document.ts        # 文档状态
│   ├── chat.ts            # 对话状态
│   └── app.ts             # 应用状态
├── types/
│   └── index.ts           # TypeScript 类型定义
├── views/
│   ├── auth/              # 认证页面
│   │   ├── LoginView.vue
│   │   └── RegisterView.vue
│   └── workspace/         # 工作区
│       ├── index.vue      # 主布局
│       └── components/
│           ├── UploadZone.vue      # 上传区域
│           ├── DocumentPreview.vue # 文档预览
│           └── ChatPanel.vue       # 对话面板
├── App.vue                 # 根组件
├── main.ts                 # 入口文件
└── style.css               # 全局样式
```

## 关键文件

| 文件 | 职责 |
|------|------|
| `src/router/index.ts` | 路由配置，含认证守卫 |
| `src/stores/auth.ts` | 用户认证状态管理 |
| `src/stores/document.ts` | 文档状态管理 |
| `src/stores/chat.ts` | 对话消息状态 |
| `src/api/index.ts` | Axios 实例，请求/响应拦截 |
| `src/views/workspace/index.vue` | 主工作区布局 |

## 组件树

```
App
└── RouterView
    ├── LoginView / RegisterView (guest)
    └── WorkspaceLayout (auth)
        ├── Header
        │   ├── Logo
        │   ├── ExportButton
        │   └── UserDropdown
        └── SplitPane
            ├── DocContainer (70%)
            │   ├── UploadZone (无文档)
            │   └── DocumentPreview
            │       ├── PDFViewer (vue-pdf-embed)
            │       ├── DocxViewer (@vue-office/docx)
            │       └── ExcelViewer (@vue-office/excel)
            └── ChatPanel (30%, 可折叠)
                ├── MessageList
                └── ChatInput
```

## 路由配置

| 路径 | 组件 | 认证 |
|------|------|------|
| `/login` | LoginView | guest |
| `/register` | RegisterView | guest |
| `/` | WorkspaceLayout | auth |
| `/doc/:id` | WorkspaceLayout | auth |

## Pinia Stores

### useAuthStore
```typescript
{
  user: User | null
  token: string | null
  isAuthenticated: computed
  login(email, password)
  register(email, password)
  fetchUser()
  logout()
}
```

### useDocumentStore
```typescript
{
  currentDoc: Document | null
  documents: Document[]
  uploadProgress: number
  loadDocument(id)
  uploadDocument(file)
  getExportUrl(id)
}
```

### useChatStore
```typescript
{
  messages: Message[]
  isStreaming: boolean
  sendMessage(docId, content)
  clearMessages()
}
```

### useAppStore
```typescript
{
  isChatPanelOpen: boolean
  theme: 'light' | 'dark'
  toggleChatPanel()
}
```

## 开发命令

```bash
npm run dev      # 开发服务器 (Vite)
npm run build    # 生产构建
npm run preview  # 预览构建结果
```

## 依赖说明

### 文档预览
- `vue-pdf-embed`: PDF 预览
- `@vue-office/docx`: Word 文档预览
- `@vue-office/excel`: Excel 预览

### UI 组件
- `naive-ui`: 完整 UI 组件库
- `tailwindcss`: 原子化 CSS

### 工具库
- `@vueuse/core`: Vue 组合式工具集
- `markdown-it`: Markdown 渲染
- `axios`: HTTP 客户端
