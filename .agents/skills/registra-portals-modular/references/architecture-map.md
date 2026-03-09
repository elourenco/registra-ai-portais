# Architecture Map

## 1) Monorepo shape
- `apps/portal-backoffice`
- `apps/portal-supplier`
- `apps/portal-customer`
- `packages/ui`
- `packages/shared`

## 2) App modular boundaries
Em cada app frontend, manter:
- `src/app`: orquestração (router, providers, layout)
- `src/features`: regras e UI da feature
- `src/widgets`: composições locais
- `src/shared`: constantes e config locais do portal

## 3) Shared packages boundaries
- `packages/ui`
  - Reuso visual/comportamental de UI.
  - Contém componentes base (button, card, table, sheet, etc.)
  - Contém módulos compartilhados de dashboard/layout em `src/dashboard/*`.

- `packages/shared`
  - Reuso de domínio frontend.
  - Schemas Zod, tipos, helpers e mock APIs.
  - Contratos do dashboard em `src/dashboard/dashboard-schema.ts`.

## 4) Current dashboard shared system
### UI layer (`packages/ui/src/dashboard`)
- `portal-app-shell.tsx`: shell autenticado (sidebar + header + mobile sheet + theme)
- `sidebar.tsx`: navegação lateral com estado colapsado
- `header.tsx`: busca, avatar/menu, toggle de tema
- `dashboard-module.tsx`: página consolidada com query + estados de tela
- `kpi-cards.tsx`: cards de KPI
- `revenue-bar-chart.tsx`: gráfico de barras
- `transactions-table.tsx`: tabela com sorting/filter/search/paginação
- `transaction-sheet.tsx`: detalhe da transação em sheet
- `use-debounced-value.ts`: debounce para filtros de busca

### Data layer (`packages/shared/src/dashboard`)
- `dashboard-schema.ts`: contratos Zod de query, snapshot, filtros e entidades
- `dashboard-mock-api.ts`: mock API com latência e erro controlado

## 5) Portal integration points
### Backoffice
- Layout: `apps/portal-backoffice/src/app/layouts/protected-layout.tsx`
- Dashboard page: `apps/portal-backoffice/src/features/dashboard/pages/dashboard-page.tsx`

### Supplier
- Layout: `apps/portal-supplier/src/app/layouts/protected-layout.tsx`
- Dashboard page: `apps/portal-supplier/src/features/dashboard/pages/dashboard-page.tsx`

### Customer
- Layout: `apps/portal-customer/src/app/layouts/protected-layout.tsx`
- Dashboard page: `apps/portal-customer/src/features/dashboard/pages/dashboard-page.tsx`

## 6) Routing standards
- Preferir route-level lazy em `src/app/router.tsx`.
- Manter `ProtectedLayout` como entrypoint de área autenticada.
- Evitar lógica de domínio direto no arquivo de rota.

## 7) Decision rubric: app vs package
Extrair para `packages/*` quando:
- Reuso em 2+ apps.
- Componente/regra de base que padroniza UX.
- Contrato de domínio comum.

Manter no app quando:
- Dependência estrita de contexto local do portal.
- Variação que não será compartilhada no curto prazo.

## 8) Non-goals
- Não transformar `packages/ui` em camada de negócio.
- Não colocar chamadas HTTP de domínio em componente visual compartilhado.
- Não duplicar schema de domínio por app.
