# Layout Enterprise Playbook

## Objetivo
Padronizar evolução de layout para os três portais com padrão enterprise/profissional, foco em consistência visual, previsibilidade de navegação e baixo risco de regressão.

## 1) Arquitetura de layout base
- Manter shell autenticado compartilhado em `packages/ui/src/dashboard/portal-app-shell.tsx`.
- Manter `apps/*/src/app/layouts/protected-layout.tsx` apenas como composição (sidebar por portal, guards e wrappers locais).
- Não mover regra de negócio de feature para o shell global.
- Extrair para `packages/ui` qualquer bloco de layout repetido em 2+ portais.

## 2) Hierarquia e navegação
- Definir uma navegação primária estável (sidebar) com agrupamento claro por domínio.
- Manter header enxuto: contexto da tela, ações globais e busca quando fizer sentido.
- Garantir que ações críticas da página fiquem na área de conteúdo, não escondidas no header global.
- Evitar múltiplos menus competindo no topo da tela.
- Preservar previsibilidade de posicionamento: navegação à esquerda, contexto no topo, conteúdo principal no `main`.

## 3) Grid, largura e densidade
- Usar grid consistente por breakpoint e evitar layout "solto" por página.
- Definir largura máxima de leitura para conteúdo textual e largura fluida para tabelas e dashboards.
- Manter espaçamento vertical regular entre blocos (`cards`, filtros, tabelas, seções).
- Evitar misturar padrões de densidade na mesma tela (ex.: cards muito espaçados e tabela super compacta).

## 4) Responsividade real (desktop e mobile)
- Desktop: sidebar fixa/collapsible e conteúdo com largura confortável.
- Mobile: sidebar em `Sheet`, sem bloquear navegação principal nem ações críticas.
- Evitar overflow horizontal em filtros e tabelas; priorizar wrap controlado ou colunas colapsáveis.
- Garantir que header e ações principais fiquem acessíveis sem depender de hover.

## 5) Estados de tela obrigatórios
- Loading: skeleton coerente com o layout final.
- Empty: mensagem objetiva + CTA explícito para próximo passo.
- Error: mensagem acionável + botão de retry.
- Evitar pulo de layout entre loading e conteúdo carregado (reduzir layout shift).

## 6) Acessibilidade para layout
- Usar landmarks semânticos: `header`, `nav`, `main`, `aside` quando aplicável.
- Garantir foco visível em links, botões e itens interativos da sidebar/header.
- Garantir navegação por teclado em menus, sheet mobile e dropdowns.
- Garantir contraste adequado entre texto, bordas e superfícies.
- Garantir labels/`aria-label` em botões apenas com ícone.

## 7) Performance aplicada ao layout
- Preservar route-level code splitting em `router.tsx`.
- Memoizar estruturas estáticas de navegação quando houver custo de re-render.
- Debounce em buscas globais/filtros que impactam listas pesadas.
- Evitar estado global desnecessário para dados que pertencem apenas a uma página.

## 8) Direção visual profissional
- Priorizar legibilidade e hierarquia antes de ornamentação.
- Manter paleta consistente com contraste robusto em claro/escuro.
- Usar animações curtas e funcionais (entrada de painel, transição de estado, feedback de ação).
- Evitar excesso de variações de sombra, raio e tamanhos de fonte na mesma superfície.

## 9) Mapeamento rápido para o monorepo
- Shell compartilhado: `packages/ui/src/dashboard/portal-app-shell.tsx`.
- Sidebar e header compartilhados: `packages/ui/src/dashboard/sidebar.tsx` e `packages/ui/src/dashboard/header.tsx`.
- Integração por portal: `apps/<portal>/src/app/layouts/protected-layout.tsx`.
- Regras e dados de feature: `apps/<portal>/src/features/*`.

## 10) Critério de pronto para mudanças de layout
- Layout funciona de forma consistente em customer, supplier e backoffice.
- Não houve duplicação de base de layout em `apps/*` quando cabia extração para `packages/ui`.
- Navegação e foco por teclado continuam íntegros.
- Estados loading/empty/error/retry permanecem implementados.
- Tema claro/escuro e sidebar colapsável continuam com persistência em `localStorage`.
