# Doc Studio - AI-Powered Document Editor

A web-based document editing platform with AI assistance. Upload, edit, and enhance your Word documents using AI-powered features.

## Features

- **Document Management**: Upload, edit, and export Word documents (.docx)
- **High-Fidelity Preview**: docx-preview for Word-accurate document rendering
- **Rich Text Editor**: Tiptap-based editor with formatting tools
- **AI Document Editing**:
  - Edit mode with intelligent content insertion/replacement
  - Selection-based editing (select text → AI modifies)
  - Full document replacement for comprehensive edits
  - HTML output for proper Word formatting (tables, lists, etc.)
- **Multi-LLM Support**: Configure OpenAI, Claude, Gemini, or custom APIs
- **Streaming Responses**: Real-time AI responses with SSE

## Tech Stack

- **Frontend**: Next.js 14, React, Tiptap, Tailwind CSS, docx-preview
- **Backend**: Django 5, Django REST Framework
- **Database**: PostgreSQL
- **Cache**: Redis
- **Document Processing**: python-docx, mammoth, beautifulsoup4

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose

### 1. Start Database Services

```bash
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Admin: http://localhost:8000/admin

## Project Structure

```
doc-studio/
├── frontend/                # Next.js frontend
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   └── lib/                 # Utilities and API client
│
├── backend/                 # Django backend
│   ├── apps/                # Django applications
│   │   ├── accounts/        # User authentication
│   │   ├── documents/       # Document management
│   │   ├── chat/            # Chat sessions
│   │   └── llm/             # LLM API key management
│   ├── core/                # Django settings
│   └── services/            # Business logic services
│
└── docker-compose.yml       # Database services
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Documents
- `GET /api/documents/` - List documents
- `POST /api/documents/` - Upload document
- `GET /api/documents/{id}/` - Get document
- `PATCH /api/documents/{id}/` - Update document
- `DELETE /api/documents/{id}/` - Delete document
- `GET /api/documents/{id}/export/` - Export as docx

### Chat
- `GET /api/chat/sessions/` - List chat sessions
- `POST /api/chat/sessions/` - Create session
- `GET /api/chat/sessions/{id}/` - Get session with messages
- `POST /api/chat/sessions/{id}/send_message/` - Send message (SSE)

### LLM API Keys
- `GET /api/llm/api-keys/` - List API keys
- `POST /api/llm/api-keys/` - Create API key
- `DELETE /api/llm/api-keys/{id}/` - Delete API key
- `POST /api/llm/api-keys/{id}/test/` - Test API key

## Configuration

### Backend Environment Variables

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
POSTGRES_DB=docstudio
POSTGRES_USER=docstudio
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# API Key Encryption
API_KEY_ENCRYPTION_KEY=your-32-byte-base64-key
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## License

MIT
