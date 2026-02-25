# Registra AI Portals

Monorepo frontend com 3 portais:
- `portal-customer`
- `portal-supplier`
- `portal-backoffice`

Stack padrão:
- React + Vite + TypeScript
- React Router
- TanStack Query
- Zod
- Motion
- shadcn/ui (via `packages/ui`)
- Referência UI: https://ui.shadcn.com/docs

## Estrutura

```text
registra-ai-portais/
├── apps/
│   ├── portal-customer/
│   ├── portal-supplier/
│   └── portal-backoffice/
├── packages/
│   ├── ui/                 # componentes compartilhados (estilo shadcn/ui)
│   └── shared/             # helpers e types compartilhados de UI/auth
├── docker/
│   └── nginx/default.conf
├── .codex/
│   ├── config.toml         # MCP local do Codex (shadcn)
│   └── skills/
│       └── registra-portals-modular/
├── AGENTS.md
├── Dockerfile
├── docker-compose.yml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Padrão modular por app

Cada app segue:

```text
src/
├── app/                    # providers, layouts, router
├── features/               # regras e telas por domínio (auth, dashboard)
├── widgets/                # blocos compostos de UI da página
└── shared/                 # config local, constantes, estilos
```

## Telas mock implementadas

Em cada portal:
- Tela de Login com validação Zod + React Hook Form
- Fluxo de autenticação mock com `useMutation` (TanStack Query)
- Dashboard mock protegido por rota autenticada
- Logout e redirecionamento

### Login mock
Use qualquer e-mail válido e senha com mínimo de 6 caracteres.

## Executar localmente

Pré-requisitos:
- Node.js 20+
- pnpm 10+

Comandos:

```bash
corepack enable
pnpm install
pnpm dev
```

Portas de desenvolvimento:
- Customer: [http://localhost:5173](http://localhost:5173)
- Supplier: [http://localhost:5174](http://localhost:5174)
- Backoffice: [http://localhost:5175](http://localhost:5175)

Comandos úteis:

```bash
pnpm dev:customer
pnpm dev:supplier
pnpm dev:backoffice
pnpm lint
pnpm format
pnpm typecheck
pnpm build
```

## Executar com Docker

### Subir os 3 portais

```bash
docker compose up --build
```

URLs:
- Customer: [http://localhost:8081](http://localhost:8081)
- Supplier: [http://localhost:8082](http://localhost:8082)
- Backoffice: [http://localhost:8083](http://localhost:8083)

### Derrubar containers

```bash
docker compose down
```

## Qualidade de código (BiomeJS)

Comandos principais:

```bash
pnpm lint              # biome lint .
pnpm format            # biome format . --write
pnpm biome:check       # valida lint + format sem escrever
pnpm biome:write       # aplica correções seguras
```

## Agents e Skills (OpenAI Codex)

### AGENTS.md do projeto
`AGENTS.md` define:
- regras de arquitetura modular
- regras de implementação da stack
- checklist de qualidade
- diretrizes de extração para `packages/*`

### Skill local recomendada
Skill criada: `registra-portals-modular` em `.codex/skills/registra-portals-modular/`.

Quando usar:
- criar/ajustar features nos 3 portais
- extrair componentes compartilhados
- ajustar roteamento/provedores
- manter Docker/README coerentes com estrutura
- implementar UI com base no shadcn/ui docs e exemplos oficiais

### MCP local do Codex
Este repositório inclui `.codex/config.toml` com servidor MCP do shadcn:

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["-y", "shadcn@latest", "mcp"]
```

Para validar no seu ambiente:

```bash
codex mcp list
```

## Referência técnica usada (Context7)
A implementação foi alinhada com documentação oficial consultada via Context7 para:
- Vite (`/vitejs/vite`)
- React Router (`/remix-run/react-router`)
- TanStack Query (`/tanstack/query`)
- shadcn/ui (`https://ui.shadcn.com/docs` e `https://ui.shadcn.com/docs/mcp`)
