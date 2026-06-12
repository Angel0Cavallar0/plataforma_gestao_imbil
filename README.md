# Plataforma de Gestão Imbil

Command Center B2B da Imbil — aplicação web para gestão interna com autenticação, permissões por módulo e módulos operacionais.

## O que está implementado

### Núcleo da plataforma

- Autenticação (Supabase Auth): login, cadastro de senha, troca de senha, bloqueio por tentativas
- Perfis, papéis hierárquicos (`superadmin` → `operacao`) e permissões por módulo/ação
- Sidebar com módulos habilitados por usuário
- **Configurações:** usuários, estrutura organizacional (departamentos/cargos), auditoria, parâmetros por módulo
- Perfil do usuário (dados e avatar)

### Módulo Marketing — Calendário de Conteúdo

- Calendário visual (FullCalendar) e listagem de posts
- CRUD de posts com **legenda/descrição** (até 2.200 caracteres) e hashtags
- Campanhas de conteúdo (cor no calendário)
- Tipos de conteúdo: imagem, vídeo, carrossel, reels, story, texto, link
- Status: rascunho, agendado, publicando, publicado, falhou, cancelado
- Publicação e edição de legenda no **Facebook**; publicação no **Instagram** (Graph API)
- **Integrações Meta** (`/configuracoes/modulos/marketing/integracoes`): credenciais por conta, tokens no Supabase Vault (gestor+)
- Publicação agendada: **pg_cron** (5 min) → Edge Function `publish-scheduled-posts` (sem Vercel Cron)

Demais módulos (Atendimento, Comercial, Financeiro, Industrial, RH) aparecem na navegação como placeholder.

## Stack

| Camada          | Tecnologia                                                  |
| --------------- | ----------------------------------------------------------- |
| Frontend        | Next.js 16 (App Router), React 19, TypeScript               |
| Estilo          | Tailwind CSS 4, componentes UI custom (padrão shadcn)       |
| Backend / dados | Supabase (Auth, PostgreSQL, Storage, Vault, Edge Functions) |
| Calendário      | FullCalendar 6                                              |
| Deploy app      | Vercel                                                      |
| Jobs agendados  | Supabase `pg_cron` + `pg_net` + Edge Functions              |

## Estrutura relevante

```
src/
  app/(app)/modulos/marketing/calendario-conteudo/   # calendário, lista, campanhas, post
  app/(app)/configuracoes/modulos/marketing/integracoes/
  server/actions/marketing/                          # posts, campanhas, credenciais Meta
  server/queries/marketing/
  lib/integrations/meta/                             # Graph API (publish, edit, delete)
supabase/
  migrations/                                        # schema public + marketing
  functions/publish-scheduled-posts/                   # cron de publicação
```

O schema PostgreSQL `marketing` isola tabelas do módulo (`platforms`, `content_posts`, `integration_credentials`, etc.). O PostgREST precisa expor o schema `marketing` no painel Supabase (**Settings → API → Exposed schemas**).

## Variáveis de ambiente

Copie `.env.example` para `.env.local` em desenvolvimento.

### Obrigatórias (app)

| Variável                        | Escopo               | Descrição                                 |
| ------------------------------- | -------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Público              | URL do projeto Supabase                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público              | Chave anon (client)                       |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Somente servidor** | Admin client (ações privilegiadas, Vault) |
| `NEXT_PUBLIC_APP_URL`           | Público              | URL canônica (links de e-mail Auth)       |

### Marketing / publicação agendada

| Variável                 | Escopo   | Descrição                                                          |
| ------------------------ | -------- | ------------------------------------------------------------------ |
| `META_GRAPH_API_VERSION` | Servidor | Versão da Graph API (padrão `v21.0`)                               |
| `CRON_SECRET`            | Servidor | Opcional: teste manual da rota `/api/cron/publish-scheduled-posts` |

A publicação agendada em produção usa a Edge Function e secrets no Supabase (ver `.env.example` e seção abaixo). **Não** commite `.env.local` nem use `NEXT_PUBLIC_` na service role.

### Checklist Vercel

1. Importar o repositório `plataforma_gestao_imbil`
2. Framework: **Next.js**
3. Em **Settings → Environment Variables**: variáveis obrigatórias + `META_GRAPH_API_VERSION` (Production e Preview)
4. Deploy da branch (ex.: preview da PR)

## Supabase

### Migrations

Arquivos em `supabase/migrations/`, em ordem numérica. Principais:

| Migration   | Conteúdo                                                                    |
| ----------- | --------------------------------------------------------------------------- |
| `001`–`007` | Schema público, RLS, perfis, org, avatars                                   |
| `008`       | Schema `marketing`, calendário, credenciais, bucket de mídia, Vault helpers |
| `009`       | Job `pg_cron` para publicação agendada                                      |
| `010`       | Grants API no schema `marketing` (`authenticator`, etc.)                    |
| `011`       | Políticas RLS que podem faltar em deploys parciais                          |

Aplicar com CLI (`supabase db push`) ou painel SQL, no projeto Imbil.

### Publicação agendada (produção)

1. Deploy da função: `supabase functions deploy publish-scheduled-posts --no-verify-jwt`
2. Secrets na Edge Function: `CRON_SECRET`, `META_GRAPH_API_VERSION` (URL e service role vêm do ambiente Supabase)
3. Vault (SQL, uma vez): `marketing.store_vault_secret('cron_service_role_key', '<SERVICE_ROLE_KEY>', ...)`
4. Migration `009` ativa o cron a cada 5 minutos

Teste manual: `POST https://<project>.supabase.co/functions/v1/publish-scheduled-posts` com header `Authorization: Bearer <CRON_SECRET>`.

### Integrações Meta (gestor+)

Em **Configurações → Parâmetros dos módulos → Integrações Meta**, informe App ID, App Secret, Page ID, Instagram User ID e System User Token. Segredos ficam no Vault; a tabela guarda apenas referências (`vault:...`).

## Primeiro superadmin

1. Criar usuário em **Supabase Dashboard → Authentication → Users**
2. Inserir registro em `profiles` com `role_id` do role `superadmin` (tabela `roles`)
3. Fazer login na aplicação

Configure também **Authentication → URL Configuration** (Site URL e redirect URLs) conforme `.env.example`.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
# preencher variáveis Supabase e APP_URL
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando            | Descrição                   |
| ------------------ | --------------------------- |
| `npm run dev`      | Servidor de desenvolvimento |
| `npm run build`    | Build de produção           |
| `npm run start`    | Servir build local          |
| `npm run lint`     | ESLint                      |
| `npm run format`   | Prettier                    |
| `npm run test`     | Vitest (unit)               |
| `npm run test:e2e` | Playwright (smoke)          |

## Permissões (resumo)

Hierarquia de papéis: `superadmin` (100) > `diretoria` (80) > `gestor` (60) > `supervisao` (40) > `operacao` (20).

| Área                                | Nível mínimo          | Observação                                                        |
| ----------------------------------- | --------------------- | ----------------------------------------------------------------- |
| Configurações (menu)                | supervisão+           | Diretoria não acessa config                                       |
| Usuários / auditoria (leitura)      | supervisão+           |                                                                   |
| Criar/editar/desativar usuários     | gestor+               |                                                                   |
| Integrações Meta                    | gestor+               | Credenciais e tokens                                              |
| Calendário de conteúdo              | permissão `marketing` | Por ação: read/create/update/delete; `superadmin` ignora checagem |
| Excluir usuário ou log de auditoria | superadmin            |                                                                   |

Usuários `operacao` precisam de acesso explícito ao módulo em `user_module_access`.

## Rotas principais

| Rota                                               | Descrição                |
| -------------------------------------------------- | ------------------------ |
| `/`                                                | Home                     |
| `/dashboards`                                      | Dashboards (placeholder) |
| `/modulos/marketing/calendario-conteudo`           | Calendário de posts      |
| `/modulos/marketing/calendario-conteudo/lista`     | Listagem                 |
| `/modulos/marketing/calendario-conteudo/campanhas` | Campanhas                |
| `/modulos/marketing/calendario-conteudo/novo`      | Novo post                |
| `/configuracoes/usuarios`                          | Gestão de usuários       |
| `/configuracoes/estrutura`                         | Estrutura organizacional |
| `/configuracoes/modulos/marketing/integracoes`     | Credenciais Meta         |
