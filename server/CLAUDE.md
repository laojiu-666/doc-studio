# Server - NestJS 后端服务

> [← 返回根目录](../CLAUDE.md)

## 模块职责

NestJS 构建的 RESTful API 服务，提供认证、文档管理、LLM 对话等功能。

## 技术栈

- **框架**: NestJS 11.x
- **ORM**: Prisma 7.2
- **数据库**: PostgreSQL
- **认证**: JWT + Passport
- **加密**: bcrypt
- **文件上传**: Multer

## 目录结构

```
src/
├── main.ts                 # 应用入口
├── app.module.ts           # 根模块
├── prisma.service.ts       # Prisma 服务
├── common/
│   ├── config/            # 配置文件
│   ├── decorators/        # 自定义装饰器
│   └── guards/            # 认证守卫
└── modules/
    ├── auth/              # 认证模块
    ├── users/             # 用户模块
    ├── documents/         # 文档模块
    ├── chat/              # 对话模块
    ├── api-keys/          # API Key 模块
    └── llm/               # LLM 适配器模块

prisma/
└── schema.prisma          # 数据库模型定义

uploads/                    # 文件上传目录
```

## 模块详情

### Auth 模块 (`modules/auth/`)

| 文件 | 职责 |
|------|------|
| `auth.module.ts` | 模块定义，导入 JWT/Passport |
| `auth.controller.ts` | 认证端点 (register/login/me) |
| `auth.service.ts` | 认证逻辑，密码哈希，Token 生成 |
| `jwt.strategy.ts` | JWT 验证策略 |
| `dto/*.ts` | 请求数据验证 |

### Documents 模块 (`modules/documents/`)

| 文件 | 职责 |
|------|------|
| `documents.module.ts` | 模块定义，配置 Multer |
| `documents.controller.ts` | 文档 CRUD 端点 |
| `documents.service.ts` | 文档存储/检索逻辑 |

### Chat 模块 (`modules/chat/`)

| 文件 | 职责 |
|------|------|
| `chat.module.ts` | 模块定义 |
| `chat.controller.ts` | 对话端点，SSE 流式响应 |
| `chat.service.ts` | 消息持久化，上下文管理 |

### LLM 模块 (`modules/llm/`)

| 文件 | 职责 |
|------|------|
| `llm.module.ts` | 模块定义 |
| `llm.service.ts` | 适配器工厂，统一调用接口 |
| `llm.interface.ts` | LLM 适配器接口定义 |
| `adapters/openai.adapter.ts` | OpenAI API 适配 |
| `adapters/claude.adapter.ts` | Claude API 适配 |
| `adapters/gemini.adapter.ts` | Gemini API 适配 |
| `adapters/custom.adapter.ts` | 自定义 API 适配 |

### API Keys 模块 (`modules/api-keys/`)

| 文件 | 职责 |
|------|------|
| `api-keys.module.ts` | 模块定义 |
| `api-keys.controller.ts` | API Key CRUD |
| `api-keys.service.ts` | Key 加密存储 |

## 数据库模型

```prisma
model User {
  id        String     @id @default(uuid())
  email     String     @unique
  password  String
  createdAt DateTime   @default(now())
  apiKeys   ApiKey[]
  documents Document[]
}

model ApiKey {
  id        String   @id @default(uuid())
  provider  String   // openai, claude, gemini, custom
  key       String   // 加密存储
  baseUrl   String?
  userId    String
  user      User     @relation(...)
}

model Document {
  id        String   @id @default(uuid())
  name      String
  type      String   // pdf, docx, xlsx, csv, txt
  path      String
  size      Int
  userId    String
  user      User     @relation(...)
  chats     Chat[]
}

model Chat {
  id         String    @id @default(uuid())
  documentId String
  document   Document  @relation(...)
  messages   Message[]
}

model Message {
  id        String   @id @default(uuid())
  role      String   // user, assistant
  content   String
  chatId    String
  chat      Chat     @relation(...)
}
```

## API 端点

### 认证 (`/api/auth`)
```
POST /register  - 用户注册
POST /login     - 用户登录
GET  /me        - 获取当前用户 [JWT]
```

### 文档 (`/api/documents`)
```
GET    /           - 文档列表 [JWT]
POST   /upload     - 上传文档 [JWT]
GET    /:id        - 文档详情 [JWT]
GET    /:id/preview - 获取预览 [JWT]
GET    /:id/export  - 导出原格式 [JWT]
DELETE /:id        - 删除文档 [JWT]
```

### 对话 (`/api/chat`)
```
POST /:docId/message - 发送消息 (SSE) [JWT]
GET  /:docId/history - 对话历史 [JWT]
```

### API Keys (`/api/api-keys`)
```
GET    /    - Key 列表 [JWT]
POST   /    - 添加 Key [JWT]
DELETE /:id - 删除 Key [JWT]
```

## LLM 适配器接口

```typescript
interface LLMAdapter {
  chat(messages: ChatMessage[], stream: boolean): AsyncIterable<string>
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type LLMProvider = 'openai' | 'claude' | 'gemini' | 'custom'
```

## 开发命令

```bash
npm run start:dev    # 开发模式 (热重载)
npm run start:debug  # 调试模式
npm run build        # 生产构建
npm run start:prod   # 生产运行

# 数据库
npx prisma migrate dev   # 开发迁移
npx prisma generate      # 生成客户端
npx prisma studio        # 数据库 GUI

# 测试
npm run test             # 单元测试
npm run test:e2e         # E2E 测试
npm run test:cov         # 覆盖率报告
```

## 环境变量

```env
# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/docstudio

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 文件存储
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50mb
```

## 依赖说明

### 核心
- `@nestjs/common`, `@nestjs/core`: NestJS 核心
- `@nestjs/platform-express`: Express 适配器
- `@nestjs/config`: 配置管理
- `@nestjs/serve-static`: 静态文件服务

### 认证
- `@nestjs/jwt`: JWT 模块
- `@nestjs/passport`: Passport 集成
- `passport-jwt`: JWT 策略
- `bcrypt`: 密码哈希

### 数据
- `@prisma/client`: Prisma 客户端
- `prisma`: Prisma CLI

### 文件
- `multer`: 文件上传中间件

### 工具
- `class-validator`: DTO 验证
- `class-transformer`: 数据转换
- `uuid`: UUID 生成
