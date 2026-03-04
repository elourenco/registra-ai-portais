# Dashboard Shared Playbook

## Objetivo
Aplicar uma forma consistente de evoluir o dashboard dos três portais sem duplicar implementação.

## 1) Como criar uma nova seção no dashboard
1. Atualizar contrato em `packages/shared/src/dashboard/dashboard-schema.ts`.
2. Atualizar mock API em `packages/shared/src/dashboard/dashboard-mock-api.ts`.
3. Criar componente em `packages/ui/src/dashboard/<novo-componente>.tsx`.
4. Integrar no `dashboard-module.tsx`.
5. Exportar via `packages/ui/src/dashboard/index.ts` e `packages/ui/src/index.ts` se necessário.
6. Validar nos três portais (backoffice, supplier, customer).

## 2) Como mexer em filtros da tabela de transações
1. Atualizar `dashboardFiltersSchema` no shared.
2. Ajustar parsing/estado em `transactions-table.tsx`.
3. Preservar:
- sorting
- filtering
- global search com debounce
- paginação
4. Garantir estado vazio com CTA e linha acionável para abrir sheet.

## 3) Como alterar detalhe de transação (Sheet)
1. Alterar UI em `transaction-sheet.tsx`.
2. Não quebrar acessibilidade básica:
- fechamento por teclado
- foco no conteúdo
- `aria` coerente nos botões principais
3. Garantir consistência de labels com `getDashboardMeta()`.

## 4) Como substituir mock por API real
1. Ler OpenAPI: `http://localhost:3000/docs/`.
2. Criar client em `apps/<portal>/src/features/<feature>/api` ou serviço compartilhado (se comum).
3. Transformar payload para o mesmo shape de `DashboardSnapshot`.
4. Validar com Zod antes de renderizar.
5. Preservar fallback visual (loading/error/empty).

## 5) Performance baseline
- Evitar recalcular colunas da tabela fora de `useMemo`.
- Debounce em search para evitar render em cada keypress.
- Evitar acoplamento da busca do header com estado pesado do gráfico.
- Preferir route-level lazy para páginas grandes.

## 6) Design and UX baseline
- Manter spacing e hierarquia de informação consistente.
- Usar sombras suaves e contraste legível.
- Manter comportamento mobile da sidebar via Sheet.
- Preservar animações discretas (sem exagero).

## 7) Regression checklist for dashboard changes
- KPI cards renderizam com valores e delta.
- Gráfico renderiza sem flicker durante filtros de tabela.
- Tabela mantém sorting, filter e paginação funcionais.
- Clique/tecla Enter na linha abre detalhe da transação.
- Estados de loading, erro e vazio continuam acessíveis.
