# Plataforma de Gestão Imbil

**Command Center B2B da Imbil** — aplicação web interna que centraliza a operação da empresa em um único ambiente, com autenticação corporativa, controle de acesso por papel hierárquico e permissão por módulo/ação, e módulos operacionais por área. O módulo de **Marketing** está implementado de ponta a ponta; as demais áreas (Atendimento, Comercial, Financeiro, Industrial, RH) já aparecem na navegação como _placeholders_ para evolução futura.

A aplicação é um app **Next.js (App Router)** publicado na **Vercel**, tendo o **Supabase** como backend (Auth, PostgreSQL, Storage, Vault e Edge Functions). Parte dos dados de marketing (insights de redes, mídia paga, concorrentes) é alimentada por **workflows n8n** que escrevem diretamente nas tabelas do schema `marketing`.

---

## Sumário

- [Resumo da aplicação](#resumo-da-aplicação)
- [Stack](#stack)
- [Módulos](#módulos)
- [Pipeline de dados (n8n)](#pipeline-de-dados-n8n)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy na Vercel](#deploy-na-vercel)
- [Configuração do Supabase](#configuração-do-supabase)
- [Desenvolvimento local](#desenvolvimento-local)
- [Scripts](#scripts)
- [Papéis e permissões](#papéis-e-permissões)
- [Rotas principais](#rotas-principais)

---

## Resumo da aplicação

A plataforma é o **centro de operações interno** da Imbil. Cada colaborador entra com login corporativo e enxerga apenas os módulos e ações liberados para seu papel. O núcleo entrega:

- **Autenticação** via Supabase Auth: login, cadastro de senha por convite, troca obrigatória de senha (a cada 90 dias), bloqueio progressivo por tentativas (5 tentativas → 15 min de bloqueio, até 3 ciclos).
- **Controle de acesso** por papel hierárquico (`superadmin` → `operacao`) **e** permissão por módulo/ação (read, create, update, delete, approve, export).
- **Configurações administrativas:** gestão de usuários e permissões, estrutura organizacional (departamentos e cargos), parâmetros por módulo e logs de auditoria.
- **Perfil do usuário:** dados pessoais, avatar e preferências (tema claro/escuro/sistema).
- **Sidebar dinâmica:** mostra apenas os módulos e submódulos que o usuário pode acessar.

O módulo de **Marketing** é o que concentra a operação de fato — do planejamento e publicação de conteúdo em redes sociais até análise de mídia paga, eventos, concorrentes e relatórios executivos.

---

## Stack

| Camada              | Tecnologia                                                                             |
| ------------------- | -------------------------------------------------------------------------------------- |
| Framework / runtime | **Next.js 16** (App Router, Server Actions), **React 19**, TypeScript                  |
| Estilo / UI         | **Tailwind CSS 4**, componentes custom no padrão **shadcn/ui**, Base UI, lucide-react  |
| Formulários         | react-hook-form + **Zod** (validação)                                                  |
| Tabelas / dados UI  | TanStack Table, Recharts (gráficos), FullCalendar 6 (calendário)                       |
| Estado / utilidades | Zustand, date-fns, sonner (toasts), dnd-kit (drag & drop)                              |
| Backend / dados     | **Supabase** — Auth, PostgreSQL (RLS), Storage, Vault, Edge Functions                  |
| Pipeline de dados   | **n8n** (workflows externos populam tabelas de insights/ads/concorrentes)              |
| Integrações sociais | **Meta Graph API** (Facebook + Instagram), **LinkedIn**, dados de Google Ads e YouTube |
| Deploy              | **Vercel** (app) + Supabase (banco, storage e jobs agendados)                          |
| Jobs agendados      | Supabase **pg_cron** + **pg_net** + Edge Function (sem Vercel Cron)                    |
| Qualidade           | ESLint, Prettier, Husky + lint-staged, Vitest (unit), Playwright (e2e)                 |

---

## Módulos

### Núcleo (todas as contas autorizadas)

| Área              | O que faz                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **Configurações** | Usuários e permissões, estrutura organizacional, parâmetros dos módulos, logs de auditoria |
| **Perfil**        | Dados pessoais, avatar, preferência de tema/idioma                                         |
| **Dashboards**    | Visão executiva — Dashboard de Marketing implementado (`/dashboards/marketing`)            |

### Marketing (implementado)

O módulo de Marketing é organizado em submódulos na sidebar:

- **Gestão de Conteúdo**
  - **Calendário de Conteúdo** — planejamento visual (FullCalendar) e em lista; CRUD de posts com legenda (até 2.200 caracteres), hashtags, mídia e campanhas (com cor no calendário). Tipos: imagem, vídeo, carrossel, reels, story. Status: rascunho → agendado → publicando → publicado / falhou / cancelado.
  - **Conteúdos Postados** — histórico do que já foi publicado nas redes, com métricas (insights de Facebook/Instagram) e cross-post (Facebook + Instagram + LinkedIn).
- **Gestão de Eventos** — cadastro de eventos e custos, **formulários públicos de captura de leads** (página pública `/f/[slug]` com QR Code), gestão de leads e cálculo de **ROI** por evento.
- **Mídia Paga** (somente leitura) — visão geral e detalhamento de campanhas de **Meta Ads**, **Google Ads** e **LinkedIn Ads**.
- **Insights** (somente leitura) — relatórios de Redes Sociais, Mídia Paga, YouTube, Acessos do Site e Menções à Marca; geração de relatórios consolidados sob demanda (com limite global de solicitações por dia).
- **Concorrentes** (somente leitura) — visão geral e análise de Redes Sociais, YouTube, Busca & Tendências, Anúncios, Notícias e Reputação dos concorrentes.

> **Publicação real nas redes:** posts agendados são publicados automaticamente pela Edge Function `publish-scheduled-posts`, disparada pelo `pg_cron` a cada 5 minutos. A publicação usa a Meta Graph API (Facebook e Instagram) e cross-post no LinkedIn. As credenciais ficam no **Supabase Vault**; a aplicação guarda apenas referências (`vault:...`).

### Demais áreas (placeholders)

Atendimento, Comercial, Financeiro, Industrial e RH aparecem na navegação, mas ainda não têm telas operacionais.

---

## Pipeline de dados (n8n)

Boa parte dos dados analíticos do módulo de Marketing **não** é coletada pela aplicação Next.js, e sim por **workflows n8n externos** que escrevem diretamente nas tabelas do schema `marketing` no Postgres do Supabase:

- Insights orgânicos e pagos (Meta, Google Ads, LinkedIn Ads, YouTube, acessos do site)
- Menções à marca e dados de concorrentes (redes, anúncios, notícias, reputação)

A aplicação **lê** essas tabelas (em geral via _views_ com `security_invoker`, respeitando RLS) e as expõe nos submódulos de Insights, Mídia Paga e Concorrentes. As migrations correspondentes são **aditivas** e idempotentes — não recriam dados, apenas garantem tabelas/views/grants.

---

## Estrutura do projeto

```
src/
  app/
    (auth)/                    # login, cadastrar-senha, trocar-senha
    (app)/                     # área autenticada (layout com sidebar)
      configuracoes/           # usuários, estrutura, módulos, auditoria
      dashboards/marketing/    # dashboard executivo de marketing
      modulos/marketing/       # calendário, conteúdos, eventos, mídia paga, insights, concorrentes
      perfil/
    (public)/f/[slug]/         # formulários públicos de captura de leads
    api/                       # rotas de API (cron, proxies Meta/LinkedIn/YouTube, lead submissions)
    auth/                      # callback, confirm, complete (fluxos do Supabase Auth)
  components/                  # UI (padrão shadcn), layout (sidebar) e telas
  lib/
    auth/                      # sessão, permissões, regras de senha
    constants/                 # navegação e enums do marketing
    integrations/meta/         # Meta Graph API (publish, edit, delete, comments)
  server/
    actions/                   # Server Actions (auth, users, org, audit, marketing/*)
    queries/                   # leituras (marketing: calendar, insights, ads, competitors, dashboard…)
supabase/
  migrations/                  # schema public + schema marketing (001 → 023)
  functions/publish-scheduled-posts/   # Edge Function de publicação agendada
```

> O schema PostgreSQL **`marketing`** isola as tabelas do módulo. O PostgREST precisa expor esse schema no painel Supabase em **Settings → API → Exposed schemas** (`public, marketing`), senão a API não enxerga as tabelas.

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` em desenvolvimento. **Nunca** comite `.env.local` nem prefixe a service role com `NEXT_PUBLIC_`.

### Obrigatórias (aplicação)

| Variável                        | Escopo               | Descrição                                            |
| ------------------------------- | -------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Público              | URL do projeto Supabase                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público              | Chave anon (cliente)                                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Somente servidor** | Admin client — ações privilegiadas e acesso ao Vault |
| `NEXT_PUBLIC_APP_URL`           | Público              | URL canônica (links dos e-mails do Supabase Auth)    |

### Marketing / publicação agendada

| Variável                 | Escopo   | Descrição                                                                  |
| ------------------------ | -------- | -------------------------------------------------------------------------- |
| `META_GRAPH_API_VERSION` | Servidor | Versão da Meta Graph API (padrão `v21.0`)                                  |
| `CRON_SECRET`            | Servidor | Opcional — protege/dispara manualmente `/api/cron/publish-scheduled-posts` |

> Em produção, a publicação agendada roda na **Edge Function** com secrets no próprio Supabase (ver [Configuração do Supabase](#configuração-do-supabase)). `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente no ambiente da Edge Function.

---

## Deploy na Vercel

O projeto já vem com `vercel.json` (`installCommand: npm ci`). Passo a passo:

1. **Importar o repositório** `plataforma_gestao_imbil` na Vercel.
2. **Framework Preset:** `Next.js` (detectado automaticamente). Build/output ficam no padrão.
3. **Environment Variables** (em _Settings → Environment Variables_), para **Production** e **Preview**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (ex.: `https://plataforma.imbil.com.br` em produção; a URL de preview da Vercel em Preview)
   - `META_GRAPH_API_VERSION` (ex.: `v21.0`)
   - `CRON_SECRET` (opcional)
4. **Deploy.** PRs geram deploys de **Preview** automaticamente; merges na branch de produção publicam em **Production**.
5. **Domínio:** aponte `plataforma.imbil.com.br` em _Settings → Domains_ e atualize `NEXT_PUBLIC_APP_URL` e as Redirect URLs do Supabase Auth para casar com o domínio final.

> **Importante:** a aplicação **não** usa Vercel Cron. A publicação agendada de posts roda inteiramente no Supabase (pg_cron + Edge Function).

---

## Configuração do Supabase

### Migrations

Os arquivos estão em `supabase/migrations/`, aplicados em ordem numérica (`001` → `023`). Aplique com a CLI (`supabase db push`) ou pelo editor SQL do painel.

| Faixa       | Conteúdo                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `001`–`007` | Schema `public`: perfis, papéis/permissões, estrutura organizacional, avatars, RLS               |
| `008`       | Schema `marketing`: calendário de conteúdo, credenciais, bucket de mídia, helpers do Vault       |
| `009`       | Job `pg_cron` para publicação agendada                                                           |
| `010`–`011` | Grants de API no schema `marketing` e políticas RLS faltantes em deploys parciais                |
| `012`–`014` | Insights de Instagram/Facebook e logs de erro de publicação                                      |
| `015`       | Avatars privados                                                                                 |
| `016`       | **Gestão de Eventos & Leads** (eventos, custos, formulários, leads, view de ROI, QR Code)        |
| `017`       | **Mídia Paga** (views somente leitura sobre tabelas de ads populadas pelo n8n)                   |
| `018`       | **Insights e Relatórios** (configs de módulo, controle de solicitações, histórico de seguidores) |
| `019`–`020` | Menções respondidas e **Concorrentes** (view consolidada)                                        |
| `021`–`022` | Colunas de mídia em storage e **cross-post LinkedIn**                                            |
| `023`       | **Dashboard de Marketing** (suporte de banco para a visão executiva)                             |

Depois de aplicar, exponha o schema `marketing` em **Settings → API → Exposed schemas**.

### Publicação agendada (produção)

1. Deploy da função: `supabase functions deploy publish-scheduled-posts --no-verify-jwt`
2. Secrets na Edge Function (_Dashboard → Edge Functions → publish-scheduled-posts → Secrets_): `CRON_SECRET`, `META_GRAPH_API_VERSION`.
3. Vault (SQL, uma vez) — guarde a service role para o `pg_cron` invocar a função:
   ```sql
   SELECT marketing.store_vault_secret(
     'cron_service_role_key',
     '<SUPABASE_SERVICE_ROLE_KEY>',
     'Auth pg_cron → Edge publish-scheduled-posts'
   );
   ```
4. A migration `009` ativa o cron a cada 5 minutos.

Teste manual:

```bash
curl -X POST "https://<project>.supabase.co/functions/v1/publish-scheduled-posts" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

### Integrações Meta (gestor+)

Em **Configurações → Parâmetros dos módulos → Integrações Meta** (`/configuracoes/modulos/marketing/integracoes`), informe App ID, App Secret, Page ID, Instagram User ID e System User Token. Os segredos vão para o **Vault**; a tabela armazena apenas as referências (`vault:...`).

### Autenticação (URL Configuration)

Em **Authentication → URL Configuration**, configure o **Site URL** e adicione as **Redirect URLs exatas** (não apenas wildcard) para os fluxos de e-mail funcionarem:

```
https://plataforma.imbil.com.br/cadastrar-senha
https://plataforma.imbil.com.br/trocar-senha
https://plataforma.imbil.com.br/auth/callback
https://plataforma.imbil.com.br/auth/confirm
https://plataforma.imbil.com.br/auth/complete
```

(e os equivalentes em `localhost` para desenvolvimento). Se `/cadastrar-senha` faltar na lista, o Supabase cai no Site URL e o link de convite quebra.

### Primeiro superadmin

1. Crie o usuário em **Authentication → Users**.
2. Insira o registro em `profiles` com o `role_id` do papel `superadmin` (tabela `roles`).
3. Faça login na aplicação.

---

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_APP_URL
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> **Atenção:** este projeto usa uma versão recente do **Next.js 16** com mudanças em relação a versões anteriores. Antes de codar, consulte os guias em `node_modules/next/dist/docs/` (ver `AGENTS.md`).

---

## Scripts

| Comando              | Descrição                   |
| -------------------- | --------------------------- |
| `npm run dev`        | Servidor de desenvolvimento |
| `npm run build`      | Build de produção           |
| `npm run start`      | Servir o build localmente   |
| `npm run lint`       | ESLint                      |
| `npm run format`     | Prettier (escrita)          |
| `npm run test`       | Vitest (unitários)          |
| `npm run test:watch` | Vitest em watch             |
| `npm run test:e2e`   | Playwright (smoke / e2e)    |

Hooks de commit (Husky + lint-staged) rodam Prettier e ESLint nos arquivos alterados.

---

## Papéis e permissões

Hierarquia de papéis (nível numérico):

`superadmin` (100) > `diretoria` (80) > `gestor` (60) > `supervisao` (40) > `operacao` (20)

| Área                                | Nível mínimo          | Observação                                                           |
| ----------------------------------- | --------------------- | -------------------------------------------------------------------- |
| Configurações (menu)                | supervisão+           | Diretoria **não** acessa Configurações                               |
| Usuários / auditoria (leitura)      | supervisão+           |                                                                      |
| Criar / editar / desativar usuários | gestor+               |                                                                      |
| Integrações Meta                    | gestor+               | Credenciais e tokens                                                 |
| Módulo Marketing                    | permissão `marketing` | Por ação (read/create/update/delete); `superadmin` ignora a checagem |
| Excluir usuário ou log de auditoria | superadmin            |                                                                      |

Usuários `operacao` precisam de **acesso explícito** ao módulo (registro em `user_module_access`).

---

## Rotas principais

| Rota                                               | Descrição                             |
| -------------------------------------------------- | ------------------------------------- |
| `/login`                                           | Login                                 |
| `/cadastrar-senha` · `/trocar-senha`               | Cadastro e troca de senha             |
| `/`                                                | Home                                  |
| `/dashboards/marketing`                            | Dashboard executivo de Marketing      |
| `/modulos/marketing/calendario-conteudo`           | Calendário de conteúdo                |
| `/modulos/marketing/calendario-conteudo/lista`     | Listagem de posts                     |
| `/modulos/marketing/calendario-conteudo/campanhas` | Campanhas                             |
| `/modulos/marketing/conteudos-postados`            | Conteúdos publicados + métricas       |
| `/modulos/marketing/eventos`                       | Gestão de eventos                     |
| `/modulos/marketing/eventos/formularios`           | Formulários de captura de leads       |
| `/modulos/marketing/eventos/leads`                 | Leads                                 |
| `/modulos/marketing/eventos/roi`                   | ROI por evento                        |
| `/modulos/marketing/midia-paga`                    | Mídia paga (Meta / Google / LinkedIn) |
| `/modulos/marketing/insights`                      | Insights e relatórios                 |
| `/modulos/marketing/concorrentes`                  | Análise de concorrentes               |
| `/configuracoes/usuarios`                          | Gestão de usuários e permissões       |
| `/configuracoes/estrutura`                         | Estrutura organizacional              |
| `/configuracoes/modulos`                           | Parâmetros dos módulos                |
| `/configuracoes/auditoria`                         | Logs de auditoria                     |
| `/configuracoes/modulos/marketing/integracoes`     | Credenciais Meta                      |
| `/f/[slug]`                                        | Formulário público de captura de lead |
