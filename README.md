<div align="center">
  <h1>📡 Mídia IPMC</h1>
  <p>
    <b>Plataforma de Gestão Integrada para a Equipe de Mídia e Comunicação</b>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
    <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  </p>
</div>

---

## 📖 Sobre o Projeto

O **Mídia IPMC** é uma aplicação web completa desenvolvida para otimizar o fluxo de trabalho da equipe de mídia e comunicação da igreja. A plataforma centraliza a gestão de voluntários, escalas de serviço, calendário de eventos, tarefas e ativos de mídia em uma interface moderna e responsiva.

## 🚀 Funcionalidades

### 📊 Dashboard
- Visão geral com **estatísticas em tempo real**: membros ativos, eventos do mês e contagem de membros escalados na semana.
- **Próxima Escala**: exibe automaticamente o próximo evento do calendário com os membros escalados e seus papéis.
- Avisos e notificações rápidas.

### 📅 Calendário & Escalas
- **Integração com Google Calendar API (OAuth 2.0)**: sincroniza eventos diretamente com a agenda do Google.
- Exibição de **feriados brasileiros** automaticamente.
- Criação, edição e exclusão de eventos sincronizados.
- Atribuição de **membros responsáveis** por evento (com persistência local para eventos do Google).
- Navegação por mês com visualização em grid.

### 👥 Gestão de Membros
- Cadastro, edição e exclusão de voluntários via API do backend (SQL direto, sem restrições de RLS).
- Filtros por **área de atuação**: Vídeo, Foto, Cobertura, Design, Social Media.
- Busca por nome.
- Integração com **WhatsApp** (botão de contato direto).
- Avatares com iniciais coloridas baseadas no nome.

### ✅ Kanban de Tarefas
- Quadro de tarefas com colunas: **Ideias → Em Progresso → Revisão → Concluído**.
- Drag & drop para mover tarefas.
- Atribuição de responsáveis e prioridades.

### 📸 Galeria de Mídia
- Upload e organização de assets (fotos e vídeos).
- Suporte a **Cloudinary** para armazenamento em nuvem.

### 📢 Avisos
- Sistema de avisos e comunicados para a equipe.

### ⚙️ Configurações
- Conexão e desconexão do **Google Calendar**.
- Gerenciamento de conta e preferências.

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnologia | Uso |
|---|---|
| **React 19** + **Vite 6** | Framework e bundler |
| **TypeScript 5** | Tipagem estática |
| **TailwindCSS** | Estilização (paleta personalizada: `church`, `cyber`, `accent`) |
| **Lucide React** | Biblioteca de ícones |
| **React Router Dom 7** | Roteamento SPA |
| **Supabase JS** | Autenticação (login/signup) |

### Backend
| Tecnologia | Uso |
|---|---|
| **Node.js 18+** + **Express 4** | Servidor HTTP |
| **TypeScript** + **tsx** | Runtime e hot-reload |
| **PostgreSQL** (Supabase) | Banco de dados relacional |
| **Google APIs** (`googleapis`) | Integração com Google Calendar |
| **JWT** + **Bcrypt** | Autenticação e hash de senhas |
| **Zod** | Validação de variáveis de ambiente |
| **Winston** | Logging estruturado |
| **Multer** + **Cloudinary** | Upload de arquivos |

### Integrações
- 🗓️ **Google Calendar API** — Sincronização de eventos e feriados
- 💬 **Evolution API** — Notificações via WhatsApp
- ☁️ **Cloudinary** — Armazenamento de mídia
- 🔐 **Supabase Auth** — Autenticação de usuários

---

## 📂 Estrutura do Projeto

```
Midia-s-project/
├── backend/
│   └── src/
│       ├── config/          # Banco de dados, env, migrações
│       ├── controllers/     # Lógica dos endpoints
│       ├── middlewares/     # Auth, CORS, error handling
│       ├── routes/          # Definição das rotas da API
│       │   ├── authRoutes.ts
│       │   ├── eventPublicRoutes.ts
│       │   ├── memberPublicRoutes.ts
│       │   ├── googleCalendarRoutes.ts
│       │   └── kanbanRoutes.ts
│       ├── services/        # Google Calendar, eventos, etc.
│       ├── types/           # Interfaces TypeScript
│       └── utils/           # Logger, helpers
│
├── frontend/
│   ├── App.tsx              # Componente principal + Dashboard
│   ├── contexts/            # AuthContext (Supabase)
│   ├── pages/
│   │   ├── Avisos/
│   │   ├── Calendar/        # CalendarPage (Google Calendar)
│   │   ├── Galery/
│   │   ├── Kanban/
│   │   ├── Login/
│   │   ├── Members/         # MembersPage (CRUD de membros)
│   │   └── Settings/
│   ├── services/            # APIs (Supabase, Google Calendar)
│   └── types/               # Interfaces compartilhadas
│
└── README.md
```

---

## 📦 Instalação e Configuração

### Pré-requisitos
- **Node.js** v18+
- **PostgreSQL** (recomendado: [Supabase](https://supabase.com) para facilitar)
- Conta no **Google Cloud Console** (para Google Calendar API)

### 1. Clone o repositório

```bash
git clone https://github.com/S4t8rn0/Midia-s-project.git
cd Midia-s-project
```

### 2. Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` na raiz do `backend`:

```env
# Servidor
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173

# Banco de Dados (PostgreSQL / Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=sua_chave_secreta
JWT_REFRESH_SECRET=sua_chave_refresh
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Google Calendar (OAuth 2.0)
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/google-calendar/callback
GOOGLE_CALENDAR_ID=primary

# Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Evolution API - WhatsApp (opcional)
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE_NAME=...
```

Execute as migrações e inicie o servidor:

```bash
npm run db:migrate
npm run dev
```

O servidor estará disponível em `http://localhost:4000`.

### 3. Frontend

```bash
cd frontend
npm install
```

Crie o arquivo `.env` na raiz do `frontend`:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

Inicie a aplicação:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

---

## 🔗 Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/register` | Registro |
| `GET` | `/api/members-public` | Listar membros |
| `POST` | `/api/members-public` | Criar membro |
| `PUT` | `/api/members-public/:id` | Atualizar membro |
| `DELETE` | `/api/members-public/:id` | Excluir membro |
| `GET` | `/api/events-public` | Listar eventos |
| `POST` | `/api/events-public` | Criar evento |
| `PUT` | `/api/events-public/:id` | Atualizar evento |
| `DELETE` | `/api/events-public/:id` | Excluir evento |
| `GET` | `/api/google-calendar/events` | Listar eventos do Google |
| `GET` | `/api/google-calendar/month-events` | Eventos do mês (Google) |
| `GET` | `/api/google-calendar/auth-url` | URL de autenticação OAuth |
| `GET` | `/api/google-calendar/status` | Status da conexão |

---

## 🎨 Paleta de Cores

O projeto utiliza uma paleta personalizada definida no TailwindCSS:

| Token | Cor | Uso |
|---|---|---|
| `church` | Roxo/Violeta | Elementos principais, bordas, badges |
| `cyber` | Ciano/Turquesa | CTAs, botões primários, destaques |
| `accent` | Laranja | Eventos, alertas, elementos de destaque |

---

## 📄 Licença

Este projeto é de uso interno da equipe de Mídia e Comunicação da IPMC.

---

<div align="center">
  <p>Feito com 💜 para a equipe de Mídia IPMC</p>
</div>
