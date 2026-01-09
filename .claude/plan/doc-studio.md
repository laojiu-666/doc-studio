# Doc Studio - 文档处理Web应用架构规划

## 项目概述
文档上传 → 保真预览 → 对话式续写改写 → 原格式导出

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Vue 3 + Vite + TypeScript |
| UI 组件 | Naive UI |
| 样式 | Tailwind CSS |
| 状态管理 | Pinia |
| 后端框架 | NestJS |
| 数据库 | PostgreSQL + Prisma |
| 认证 | JWT + bcrypt |
| 文档预览 | pdf.js, @vue-office/docx, @vue-office/excel |
| 流式响应 | SSE (Server-Sent Events) |

## 后端架构

### 目录结构
```
src/
  main.ts
  app.module.ts
  common/
    config/           # app, jwt, llm, storage 配置
    constants/        # error-codes, mime-types
    guards/           # jwt.guard, api-key.guard
    interceptors/     # stream.interceptor
    pipes/            # validation.pipe
    utils/            # crypto, file 工具
  modules/
    auth/             # 认证模块 (register, login, refresh)
    users/            # 用户模块
    documents/        # 文档模块 (upload, preview, export)
    llm/              # LLM适配器模块
    chat/             # 对话模块
prisma/
  schema.prisma
```

### 数据库 Schema
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  apiKeys   ApiKey[]
  documents Document[]
}

model ApiKey {
  id        String   @id @default(uuid())
  provider  String   // openai, claude, gemini, custom
  key       String   // 加密存储
  baseUrl   String?  // 自定义URL
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}

model Document {
  id        String   @id @default(uuid())
  name      String
  type      String   // pdf, docx, xlsx, csv, txt
  path      String
  size      Int
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  chats     Chat[]
  createdAt DateTime @default(now())
}

model Chat {
  id         String    @id @default(uuid())
  documentId String
  document   Document  @relation(fields: [documentId], references: [id])
  messages   Message[]
  createdAt  DateTime  @default(now())
}

model Message {
  id        String   @id @default(uuid())
  role      String   // user, assistant
  content   String
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id])
  createdAt DateTime @default(now())
}
```

### API 端点
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /auth/register | 用户注册 |
| POST | /auth/login | 用户登录 |
| POST | /auth/refresh | 刷新Token |
| GET | /documents | 文档列表 |
| POST | /documents/upload | 上传文档 |
| GET | /documents/:id/preview | 获取预览 |
| GET | /documents/:id/export | 导出原格式 |
| POST | /chat/:docId/message | 发送消息（SSE流式） |
| GET | /api-keys | API Key列表 |
| POST | /api-keys | 添加API Key |

### LLM 适配器
```typescript
interface LLMAdapter {
  chat(messages: Message[], stream: boolean): AsyncIterable<string>
}

class OpenAIAdapter implements LLMAdapter { ... }
class ClaudeAdapter implements LLMAdapter { ... }
class GeminiAdapter implements LLMAdapter { ... }
class CustomAdapter implements LLMAdapter { ... }
```

## 前端架构

### 目录结构
```
src/
  api/              # auth.ts, document.ts, chat.ts
  components/
    common/         # 基础组件
    business/       # FileUpload, MarkdownRenderer
  hooks/            # useDragDrop, useWebSocket
  layouts/          # AuthLayout, WorkspaceLayout
  router/
  stores/           # auth, document, chat, app
  types/
  utils/
  views/
    auth/           # LoginView, RegisterView
    workspace/      # 工作区 + 私有组件
```

### 组件树
```
App
└── RouterView
    ├── AuthLayout (登录/注册)
    └── WorkspaceLayout
        ├── HeaderBar (导航/用户/导出)
        └── SplitPane
            ├── DocContainer (70%)
            │   ├── UploadZone (无文档时)
            │   └── UniversalPreviewer
            │       ├── PDFViewer
            │       ├── OfficeViewer
            │       └── TextViewer
            └── ChatPanel (30%, 可折叠)
                ├── ChatList → MessageItem
                └── ChatInput
```

### Pinia Stores
- `useAuthStore`: user, token, login/logout
- `useDocumentStore`: currentDoc, uploadStatus, uploadProgress
- `useChatStore`: messages, isStreaming, sendMessage
- `useAppStore`: isChatPanelOpen, splitRatio, theme

## 实施阶段

### 阶段 1: 基础搭建
- [ ] NestJS 项目初始化
- [ ] Vue 3 + Vite 项目初始化
- [ ] PostgreSQL + Prisma 配置
- [ ] 认证模块 (JWT)

### 阶段 2: 文档模块
- [ ] 文档上传 API
- [ ] 文件存储服务
- [ ] 文档预览组件

### 阶段 3: LLM 集成
- [ ] LLM 适配器架构
- [ ] OpenAI/Claude/Gemini 适配器
- [ ] SSE 流式响应

### 阶段 4: 对话功能
- [ ] Chat UI 组件
- [ ] 消息持久化
- [ ] 上下文管理

### 阶段 5: 导出功能
- [ ] 原格式导出
- [ ] 文档修改合并
