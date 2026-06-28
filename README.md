<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CondoTrust — Gestão de Condomínio

Sistema completo para gestão de condomínios com controle financeiro, transparência para moradores e mural de avisos.

## Tecnologias

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL

## Rodar Localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
   Preencha `JWT_SECRET` com uma string forte e configure as credenciais de admin e residente.

3. Rode o servidor:
   ```bash
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000)

## Deploy

Consulte o [DEPLOY.md](./DEPLOY.md) para instruções completas de deploy na Vercel + Render.
