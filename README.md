<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CondoTrust — Gestão de Condomínio

Sistema completo para gestão de condomínios com controle financeiro, transparência para moradores e mural de avisos.

🌐 **Demo**: [gestor-de-condom-nio.vercel.app](https://gestor-de-condom-nio.vercel.app)

## Tecnologias

- **Frontend**: React + Vite + Tailwind CSS (Vercel)
- **Backend**: Node.js + Express + PostgreSQL (Render)

## Rodar Localmente

**Pré-requisitos:** Node.js, PostgreSQL

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
   Preencha `DATABASE_URL` com sua conexão PostgreSQL e `JWT_SECRET` com uma string forte.

3. Rode o servidor:
   ```bash
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000)

## Credenciais de Demo

| Perfil  | Email                  | Senha           |
|---------|------------------------|-----------------|
| Admin   | admin@condo.com        | C0nd0@Admin2024!    |
| Morador | morador@condo.com      | C0nd0@Morador2024!  |

## Deploy

Consulte o [DEPLOY.md](./DEPLOY.md) para instruções completas de deploy na Vercel + Render.
