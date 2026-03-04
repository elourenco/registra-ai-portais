---
name: registra-portals-modular
description: Evoluir ou refatorar o monorepo Registra AI (portais customer, supplier e backoffice) com arquitetura modular por app, extraindo reuso para packages/ui e packages/shared, preservando padrões React + Vite + TypeScript + React Router + TanStack Query + Zod + shadcn/ui. Usar quando criar features, ajustar rotas/layout/provedores, padronizar dashboard compartilhado, reduzir duplicação entre portais, integrar API real com contratos tipados, ou revisar qualidade arquitetural do frontend.
---

# Registra Portals Modular

## Objetivo
Padronizar a evolução dos três portais com foco em:
- reuso real entre apps
- consistência de arquitetura
- qualidade de tipagem e validação
- entrega com baixo risco de regressão

## Leitura progressiva (abrir conforme necessidade)
- Ler sempre: `references/architecture-map.md`
- Ler quando alterar dashboard/layout: `references/dashboard-shared-playbook.md`
- Ler quando alterar layout autenticado/navegação: `references/layout-enterprise-playbook.md`
- Ler antes de fechar QA de layout: `references/layout-review-checklist.md`
- Ler antes de finalizar entrega: `references/delivery-checklist.md`

## Workflow obrigatório
1. Identificar o escopo da mudança.
- Classificar como local de um portal ou compartilhada.
- Tratar como compartilhada quando impactar 2+ apps ou quando for base de layout/dashboard.

2. Definir destino correto do código.
- Colocar UI compartilhada em `packages/ui`.
- Colocar schemas, tipos e helpers de domínio em `packages/shared`.
- Manter páginas e orquestração por rota no app consumidor.

3. Preservar arquitetura por app.
- Manter `app/`, `features/`, `widgets/`, `shared/`.
- Evitar lógica de feature dentro de `app/`.

4. Implementar com stack oficial.
- Usar TanStack Query para async.
- Usar Zod para validação de input/filtros.
- Usar componentes e padrões do shadcn/ui.

5. Implementar rota/página/feature.
- Definir rota em `src/app/router.tsx` (preferir lazy por rota).
- Criar página em `features/<feature>/pages`.
- Criar componentes em `features/<feature>/components`.
- Criar API/query hooks em `features/<feature>/api` ou pacote compartilhado.

6. Validar responsividade e acessibilidade.
- Garantir desktop e mobile.
- Garantir foco visível e interações por teclado nos elementos principais.

7. Validar qualidade técnica.
- Executar `pnpm typecheck`.
- Executar `pnpm build` para apps impactadas.
- Revisar regressão visual quando mudança for de layout/dashboard.

8. Atualizar documentação operacional quando necessário.
- Atualizar `AGENTS.md` em mudança estrutural.
- Atualizar `agents/openai.yaml` da skill quando o escopo da skill mudar.

## Matriz de decisão (onde implementar)
- Criar ou alterar layout autenticado cross-portal:
  - Preferir `packages/ui/src/dashboard/portal-app-shell.tsx`
- Criar ou alterar dashboard financeiro comum:
  - Preferir `packages/ui/src/dashboard/*`
- Criar contratos de dados compartilhados:
  - Preferir `packages/shared/src/dashboard/dashboard-schema.ts` (ou módulo de domínio equivalente)
- Criar mock/fake backend de domínio compartilhado:
  - Preferir `packages/shared/src/<dominio>/*-mock-api.ts`
- Ajustar navegação específica de um portal:
  - Ajustar `apps/<portal>/src/app/layouts/protected-layout.tsx`

## Guardrails
- Não duplicar componente em 2+ apps se puder extrair para `packages/*`.
- Não misturar regra de negócio de feature em `app/providers`.
- Não quebrar TypeScript strict com `any`.
- Não adicionar dependência sem necessidade clara.
- Não deixar rota protegida sem layout/guard centralizado.

## Playbooks rápidos
### A) Nova feature local de portal
1. Criar `features/<feature>/pages`.
2. Criar `features/<feature>/components`.
3. Criar `features/<feature>/api` com TanStack Query.
4. Declarar rota lazy no `router.tsx`.
5. Atualizar sidebar/menus no `ProtectedLayout` se necessário.

### B) Refactor compartilhado de layout/dashboard
1. Implementar primeiro em `packages/ui`.
2. Expor pelo `packages/ui/src/index.ts`.
3. Conectar nos três `ProtectedLayout`/`DashboardPage`.
4. Garantir que não sobrou componente duplicado em `apps/*`.

### C) Trocar mock por API real
1. Ler OpenAPI em `http://localhost:3000/docs/`.
2. Atualizar schemas Zod em `packages/shared`.
3. Adaptar query functions mantendo o mesmo contrato consumido pela UI.
4. Preservar loading/empty/error state.

### D) Evolução de layout enterprise
1. Ler `references/layout-enterprise-playbook.md`.
2. Implementar base compartilhada primeiro em `packages/ui` quando houver reuso.
3. Integrar por portal via `ProtectedLayout`, sem acoplar regra de feature no shell.
4. Validar responsividade, acessibilidade e estados de tela com `references/layout-review-checklist.md`.

## Checklist mínimo de entrega
- Typecheck sem erro.
- Build sem erro nas apps impactadas.
- Sem duplicação desnecessária entre portais.
- Sem `any` introduzido.
- Estados de loading/empty/error cobertos em listas/tabelas críticas.
- Documentação ajustada quando mudança for estrutural.
