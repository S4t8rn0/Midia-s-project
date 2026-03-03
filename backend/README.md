# Backend - Mídia Igreja API

## Requisitos
- Node.js 18+
- PostgreSQL 14+

## Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

**Variáveis obrigatórias:**
- `DATABASE_URL` - String de conexão do PostgreSQL
- `JWT_SECRET` - Chave secreta para tokens JWT
- `JWT_REFRESH_SECRET` - Chave secreta para refresh tokens

### 3. Criar banco de dados
No PostgreSQL, crie o banco de dados:
```sql
CREATE DATABASE midia_igreja;
```

### 4. Executar migrações
```bash
npm run db:migrate
```

### 5. Iniciar servidor
```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

## Estrutura do Projeto

```
src/
├── config/         # Configurações (env, database)
├── controllers/    # Controllers das rotas
├── middlewares/    # Auth, error handling
├── models/         # Modelos do banco (futuro)
├── routes/         # Rotas Express
├── services/       # Lógica de negócio
├── types/          # Tipos TypeScript
├── utils/          # Utilitários (logger)
└── index.ts        # Entry point
```

## Endpoints

### Auth
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário logado

### Health
- `GET /api/health` - Status da API

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| PORT | Porta do servidor | Não (default: 4000) |
| NODE_ENV | Ambiente | Não (default: development) |
| DATABASE_URL | URL PostgreSQL | Sim |
| JWT_SECRET | Chave JWT | Sim |
| JWT_REFRESH_SECRET | Chave refresh | Sim |
| FRONTEND_ORIGIN | URL do frontend | Não (default: localhost:5173) |
