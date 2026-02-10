---
name: registra-portals-modular
description: Evoluir o monorepo dos portais Registra AI com arquitetura modular limpa e consistente entre apps (customer, supplier, backoffice). Use quando criar features frontend, ajustar rotas/provedores, extrair componentes compartilhados, configurar Docker frontend, ou manter padrões React + Vite + TypeScript + React Router + TanStack Query + Zod + Motion + shadcn/ui.
---

# Registra Portals Modular

## Workflow
1. Identificar se a mudança é local de um portal ou compartilhada.
2. Se compartilhada, priorizar `packages/ui` (UI) e `packages/shared` (schemas/helpers/types).
3. Manter estrutura por app: `app`, `features`, `widgets`, `shared`.
4. Para novas telas:
- Definir rota em `src/app/router.tsx`.
- Criar página em `features/<feature>/pages`.
- Criar componentes em `features/<feature>/components`.
- Criar API client/query hooks em `features/<feature>/api`.
5. Usar Zod para entrada de dados e TanStack Query para mutation/query.
6. Manter autenticação e proteção de rota no layout/provedor central.
7. Atualizar Docker/README quando a mudança alterar execução.

## Guardrails
- Não duplicar componente em mais de um portal quando puder ser reutilizado.
- Não colocar regra de negócio de feature em `app/providers`.
- Não acoplar estilos ao portal se puder ser tema/configuração.
- Evitar dependências novas sem necessidade clara.

## Checklist de entrega
- Typecheck sem erro.
- Build das apps impactadas sem erro.
- README atualizado (quando necessário).
