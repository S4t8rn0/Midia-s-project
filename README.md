<div align="center">
  <h1 align="center">Ecclesia Media Hub</h1>
  <p align="center">
    <b>Plataforma de Gestão Integrada para Equipes de Mídia da Igreja</b>
  </p>
</div>

---

## 📖 Sobre o Projeto

O **Ecclesia Media Hub** (Midia-s-project) é uma aplicação desenvolvida para otimizar o fluxo de trabalho das equipes de mídia nas igrejas. A plataforma centraliza a gestão de tarefas, escalas, calendário de eventos e ativos de mídia em um único lugar, facilitando a comunicação e organização do ministério.

## 🚀 Funcionalidades

- **📋 Dashboard Interativo**: Visão geral das atividades do dia, próximos eventos e status da equipe.
- **📅 Calendário & Eventos**: Integração completa com **Google Calendar API (OAuth)** para visualizar e gerenciar escalas e eventos.
- **✅ Kanban de Tarefas**: Quadro de tarefas (A Fazer, Em Progresso, Concluído) para organizar projetos de mídia.
- **👥 Gestão de Membros**: Cadastro e administração dos voluntários e membros da equipe técnica.
- **💬 Comunicação**: Integração com **WhatsApp** via **Evolution API** para notificações automáticas.
- **📸 Galeria de Mídia**: Armazenamento e organização de assets (fotos/vídeos) com suporte a **Cloudinary** ou **MinIO** (Self-hosted).

## 🛠️ Stack Tecnológico

### Frontend
- **React** (Vite)
- **TailwindCSS** (Estilização)
- **Lucide React** (Ícones)
- **React Router Dom**

### Backend & Infraestrutura
- **Node.js** + **Express**
- **Autenticação**: **JWT** (JSON Web Tokens) + **Bcrypt** para hash de senhas.
- **Banco de Dados**: **PostgreSQL**.
- **Storage**: **Cloudinary** (Inicial) ou **VPS + MinIO** (Para maior volume de dados).
- **Integrações**: 
  - **Google Calendar API** (Agenda)
  - **Evolution API** (WhatsApp)

## 📦 Instalação e Configuração

Siga os passos abaixo para rodar o projeto localmente.

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL (Instalado localmente ou instância remota)

### 1. Backend Setup

1. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente (`.env`):
   ```env
   PORT=4000
   DATABASE_URL=postgresql://user:pass@localhost:5432/midia_db
   JWT_SECRET=sua_secret_key
   
   # Google Calendar
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   
   # Storage (Cloudinary)
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   
   # Evolution API (WhatsApp)
   EVOLUTION_API_URL=...
   EVOLUTION_API_KEY=...
   ```
4. Execute as migrações do banco (se houver script configurado) ou crie as tabelas no PostgreSQL.
5. Inicie o servidor:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Em um novo terminal, navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz do `frontend`:
   ```env
   VITE_API_BASE_URL=http://localhost:4000
   ```
4. Inicie a aplicação:
   ```bash
   npm run dev
   ```

## 📄 Licença

Este projeto é de uso interno/privado.
