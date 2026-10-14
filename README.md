# Controle Financeiro — Lima Advogados

App interno para controlar **pagamentos, assinaturas recorrentes e reembolsos** do
escritório, com **fechamento mensal** (assinaturas esperado × cobrado, reembolsos
devido × pago e conferência de recibos).

Feito em **React + Vite + TypeScript + Tailwind**, conectado a um **Supabase** (banco
PostgreSQL + autenticação + storage) da sua própria conta. Sem dependência de
plataformas de build — o banco é seu, com dashboard completo.

---

## Pré-requisitos

- Node.js 18+ e npm
- Uma conta no [Supabase](https://supabase.com) (plano free já atende)

---

## Passo 1 — Criar o projeto Supabase

1. Entre em https://supabase.com/dashboard → **New project**.
2. Nome: `lima-controle-financeiro` · Região: **South America (São Paulo)**.
3. Defina e guarde a senha do banco.

## Passo 2 — Criar o banco (schema + dados)

1. No projeto, abra **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   - Isso cria as tabelas `assinaturas` e `lancamentos`, ativa o RLS, cria o bucket
     privado `recibos` e **já carrega os 48 lançamentos e 9 assinaturas** migrados da
     planilha.

## Passo 3 — Desligar a confirmação de e-mail

Para a equipe criar conta e já entrar (sem precisar de e-mail de confirmação):

- **Authentication → Sign In / Providers → Email** → desligue **"Confirm email"** → Save.

> Isso é recomendado por ser um sistema interno. Se preferir manter a confirmação,
> será preciso configurar um provedor de e-mail (SMTP) no Supabase.

## Passo 4 — Conectar o app ao Supabase

1. No Supabase: **Project Settings → API**. Copie:
   - **Project URL**
   - **anon public** (a chave pública — **nunca** use a `service_role`).
2. Na raiz do projeto, copie `.env.example` para `.env` e preencha:

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
   ```

## Passo 5 — Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço mostrado (ex.: http://localhost:5173), clique em **"Primeiro acesso?
Criar conta"**, defina e-mail e senha — você entra direto no Painel.

---

## Publicar na Netlify

1. Suba o projeto para um repositório Git (GitHub/GitLab).
2. Na Netlify: **Add new site → Import an existing project** e selecione o repositório.
   - Build command: `npm run build` · Publish directory: `dist` (já definido em `netlify.toml`).
3. Em **Site settings → Environment variables**, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` com os mesmos valores do `.env`.
4. Deploy. O `netlify.toml` já trata o redirecionamento de SPA.

> Alternativa rápida sem Git: `npm run build` e arraste a pasta `dist/` no painel da
> Netlify (lembre de configurar as variáveis de ambiente).

---

## Segurança

- A **chave anon é pública por natureza** — pode ir no frontend. A proteção real é o
  **RLS**: só usuários autenticados leem/gravam. Nunca exponha a chave `service_role`.
- `.env` está no `.gitignore` — não suba segredos ao Git.
- Enquanto a criação de conta estiver aberta, qualquer pessoa com o link pode se
  cadastrar. Depois que a equipe criar as contas, dá para **desligar novos cadastros**
  em Supabase → Authentication → **"Allow new users to sign up"**.

---

## Estrutura

```
src/
  context/      AuthContext, DataContext (CRUD), MonthContext (mês global)
  components/   Layout, Sidebar, Modal, formulários, gráficos
  pages/        Login, Dashboard, Lancamentos, Assinaturas, Fechamento
  lib/          supabase, types, format (R$/datas), fechamento (regras)
supabase/
  schema.sql    schema + RLS + storage + dados migrados
```

## Dados migrados (da planilha original)

- 48 lançamentos (abr→out/2026): 22 de assinaturas, 17 reembolsos, 9 compras.
- 9 assinaturas recorrentes (Jusbrasil, Clicksign, In Company, coworking, créditos de
  celular, Lovable, Netlify, Registro.br).
- Netlify fica em **US$** e não é somado ao total em R$ (câmbio à parte).
- Reembolsos históricos entram como já reembolsados e com recibo; 1 pendente
  (In Company de 11/out).

## Como funciona o fechamento

- **Assinaturas**: para o mês escolhido, confere se cada recorrente **ativa** teve um
  lançamento tipo *assinatura* vinculado. Mensais checam o próprio mês; anuais
  consideram os últimos 12 meses. Marca "Caiu" / "Faltou" e sinaliza valor divergente.
- **Reembolsos**: agrupa por beneficiário; mostra devido × pago e permite marcar como
  reembolsado na hora.
- **Recibos**: calcula o % de lançamentos com recibo e lista os que faltam anexar.
