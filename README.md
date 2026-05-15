# Plataforma de Gestão Imbil

Command Center B2B da Imbil — Fase 1: casca da aplicação (auth, navegação, configurações, usuários e permissões).

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + componentes UI custom (padrão shadcn)
- Supabase Auth + PostgreSQL (RLS)
- Deploy: **Vercel** (configuração manual)

## Variáveis de ambiente

Copie `.env.example` para `.env.local` em desenvolvimento.

| Variável | Escopo | Vercel |
|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Público | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | **Somente servidor** | Production + Preview |
| `NEXT_PUBLIC_APP_URL` | Links de e-mail | Production + Preview |

**Nunca** commite `.env.local` nem exponha a service role no client (`NEXT_PUBLIC_`).

### Checklist Vercel

1. Importar repositório `plataforma_gestao_imbil`
2. Framework: Next.js
3. Em **Settings → Environment Variables**, configurar as quatro variáveis acima
4. Deploy

## Primeiro superadmin

1. Criar usuário em **Supabase Dashboard → Authentication → Users**
2. Inserir registro em `profiles` com `role_id` do role `superadmin` (consultar tabela `roles`)
3. Fazer login na aplicação

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
# preencher variáveis
npm run dev
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — ESLint
- `npm run test` — Vitest
- `npm run test:e2e` — Playwright (smoke)

## Migrations Supabase

Arquivos em `supabase/migrations/`. Aplicadas no projeto Imbil via Supabase MCP.

## Hierarquia de permissões (Fase 1)

| Ação | Nível mínimo |
|------|----------------|
| Configurações (menu) | supervisão+ (exceto diretoria) |
| Ver usuários / auditoria | supervisão+ |
| Desbloquear / solicitar senha | supervisão+ |
| Criar/editar/desativar usuários | gestor+ |
| Excluir usuário ou log | superadmin |
