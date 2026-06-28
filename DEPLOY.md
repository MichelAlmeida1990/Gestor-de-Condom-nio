# 🚀 Guia de Deploy - Vercel + Render

## Arquitetura

```
Frontend (Vercel)              Backend (Render)
React + Vite          →        Express + PostgreSQL
condo-manager.vercel.app       condo-api.onrender.com
```

---

## 📦 1. Deploy do Backend (Render)

### 1.1 Criar conta no Render
- Acesse https://render.com
- Faça login com GitHub

### 1.2 Criar PostgreSQL Database
1. No dashboard, clique em **New +** → **PostgreSQL**
2. Configure:
   - **Name**: `condo-manager-db`
   - **Database**: `condo`
   - **User**: `condo_user`
   - **Region**: escolha o mais próximo
   - **Plan**: **Free**
3. Clique em **Create Database**
4. Aguarde a criação (1-2 minutos)
5. **Copie a "Internal Database URL"** (você vai precisar)

### 1.3 Criar Web Service
1. No dashboard, clique em **New +** → **Web Service**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `condo-manager-api`
   - **Region**: mesma do banco
   - **Branch**: `main`
   - **Root Directory**: deixe vazio
   - **Runtime**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `node --require tsx/cjs server.ts`
   - **Plan**: **Free**

### 1.4 Adicionar Variáveis de Ambiente
Na seção **Environment Variables**, adicione:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=<sua-chave-secreta-forte>
DATABASE_URL=<internal-database-url-do-render>
ALLOWED_ORIGINS=https://<sua-url-do-frontend-vercel>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongAdminPassword123!
RESIDENT_EMAIL=resident@example.com
RESIDENT_PASSWORD=StrongResidentPassword123!
```

- Use a URL interna do banco do Render para `DATABASE_URL`.
- `ALLOWED_ORIGINS` deve conter a URL exata do frontend Vercel.

4. Clique em **Create Web Service**
5. Aguarde o deploy (3-5 minutos)
6. **Copie a URL do serviço** (ex: `https://condo-manager-api.onrender.com`)

---

## 🎨 2. Deploy do Frontend (Vercel)

### 2.1 Criar conta na Vercel
- Acesse https://vercel.com
- Faça login com GitHub

### 2.2 Importar Projeto
1. No dashboard, clique em **Add New...** → **Project**
2. Selecione seu repositório `condo-manager`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: deixe vazio
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.3 Adicionar Variável de Ambiente
Na seção **Environment Variables**, adicione:

```
VITE_API_URL=<cole a URL do Render do passo 1.3.6>
```

Exemplo: `VITE_API_URL=https://condo-manager-api.onrender.com`

4. Clique em **Deploy**
5. Aguarde o deploy (2-3 minutos)
6. **Copie a URL do projeto** (ex: `https://condo-manager.vercel.app`)

### 2.4 Atualizar CORS no Backend
1. Volte ao Render
2. Vá em **Environment** do seu Web Service
3. Edite `ALLOWED_ORIGINS` e adicione a URL da Vercel:
   ```
   ALLOWED_ORIGINS=https://condo-manager.vercel.app
   ```
4. Salve (o Render vai fazer redeploy automático)

---

## ✅ 3. Testar o Deploy

1. Acesse a URL da Vercel
2. Faça login com as credenciais configuradas no ambiente de produção.

---

## 🔧 4. Troubleshooting

### Erro de CORS
- Verifique se `ALLOWED_ORIGINS` no Render contém a URL exata da Vercel
- Verifique se `VITE_API_URL` na Vercel aponta para o Render

### Erro 500 no Backend
- Verifique os logs no Render: Dashboard → Service → Logs
- Confirme que `DATABASE_URL` está correta

### Frontend não conecta ao Backend
- Abra o DevTools (F12) → Network
- Verifique se as requisições estão indo para a URL correta do Render
- Confirme que `VITE_API_URL` foi configurada na Vercel

### Banco de dados vazio
- O backend cria as tabelas e dados de seed automaticamente no primeiro start
- Se não funcionar, acesse o Render → Database → Connect → PSQL Command
- Execute manualmente as queries do `server.ts` (seção `initDB`)

---

## 📝 5. Próximos Passos

- [ ] Trocar senhas padrão por senhas fortes
- [ ] Configurar domínio customizado na Vercel
- [ ] Configurar SSL/HTTPS (já vem por padrão)
- [ ] Monitorar logs e performance no Render
- [ ] Configurar backups do PostgreSQL (plano pago)

---

## 🆘 Suporte

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
