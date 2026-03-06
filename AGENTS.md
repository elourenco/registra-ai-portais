# AGENTS.md

## Objetivo

Evoluir o monorepo frontend da Registra AI, composto pelos portais `customer`, `supplier` e `backoffice`, preservando modularidade, consistência visual, reuso entre apps e qualidade de código.

## Baseline atual

- Stack principal: `React`, `Vite`, `TypeScript strict`, `Tailwind`, `React Router`, `TanStack Query`, `Zod`.
- Layout autenticado padronizado em `packages/ui/src/dashboard/portal-app-shell.tsx`.
- Dashboard compartilhado centralizado em `packages/ui/src/dashboard/*`.
- Schemas e mocks do dashboard centralizados em `packages/shared/src/dashboard/*`.
- Rotas principais já usam code splitting com `lazy` nos `router.tsx`.
- Tema claro/escuro persiste em `localStorage` com a chave `registra-ai.theme`.
- Estado da sidebar persiste por portal em `localStorage`.

## Princípios obrigatórios

- Manter a arquitetura modular por app: `app/`, `features/`, `widgets/`, `shared/`.
- Usar `app/` apenas para orquestração: providers, layout, roteamento e guards.
- Extrair UI reutilizável para `packages/ui`.
- Extrair tipos, schemas Zod, helpers e contratos frontend para `packages/shared`.
- Qualquer implementação repetida em 2 ou mais apps deve ser promovida para `packages/*`.
- Não colocar regra de negócio de feature em layout global, providers globais ou shell compartilhado.

## Regras de implementação

- Stack padrão para novas entregas: `React + Vite + TypeScript + React Router + TanStack Query + Zod + Motion + shadcn/ui`.
- Validar formulários, filtros e parâmetros de entrada com `Zod`.
- Modelar fluxos assíncronos com `TanStack Query`.
- Garantir rotas protegidas via guard ou layout centralizado.
- Garantir responsividade desktop/mobile e navegação por teclado.
- Priorizar componentes e padrões oficiais do `shadcn/ui`.
- Sempre que viável, consultar MCP do `shadcn` e `Context7` antes de implementar manualmente.
- Para API real, consultar o OpenAPI local em `http://localhost:3000/docs/`.
- Manter visual profissional, com animações leves e sem excesso.

## Responsabilidade por camada

### `apps/*/src/app`

- Concentrar bootstrap, providers, layouts, guards e roteamento.
- Manter `router.tsx` com lazy loading por rota sempre que viável.
- Usar `layouts/protected-layout.tsx` apenas para composição de shell e autenticação.

### `apps/*/src/features`

- Organizar por feature, por exemplo: `<feature>/api`, `<feature>/components`, `<feature>/hooks`, `<feature>/core`, `<feature>/utils`, `<feature>/pages`.
- Manter chamadas de API e query hooks dentro da própria feature.
- Usar `core/` para código puro da feature, como adapters, normalizers, selectors e regras sem dependência de React.
- Usar `utils/` apenas para helpers locais de apresentação ou apoio que não justificam extração para `shared/`.
- Deixar páginas enxutas, delegando UI e lógica auxiliar para componentes e hooks.

### `apps/*/src/widgets`

- Reservar para composições locais do portal que ainda não justificam extração para pacote compartilhado.

### `apps/*/src/shared`

- Manter constantes locais de rota, configuração, tokens e estilos específicos do portal.

### `packages/ui`

- Reunir componentes base do design system, como `button`, `card`, `sheet`, `table`.
- Reunir componentes cross-portal de dashboard e layout em `src/dashboard/*`.
- Exportar a API pública pelo `src/index.ts`.

### `packages/shared`

- Reunir schemas `Zod`, tipos, helpers e contratos de domínio frontend.
- Manter o contrato do dashboard em `src/dashboard/dashboard-schema.ts`.
- Manter a API mock do dashboard em `src/dashboard/dashboard-mock-api.ts`.

## Dashboard compartilhado

- A rota `/dashboard` de cada portal deve preferir `DashboardModule` de `@registra/ui`.
- O layout autenticado deve preferir `PortalAppShell` de `@registra/ui`.
- A sidebar específica de cada portal deve ser declarada no `ProtectedLayout` por meio de `SidebarSection[]`.
- A tabela de transações deve preservar:
  - sorting
  - filtros por status e categoria
  - busca com debounce
  - paginação
  - abertura de detalhe em `Sheet`
- Estados obrigatórios:
  - loading com skeleton
  - empty state com CTA
  - error state com retry

## Padrões React e TypeScript

- Usar exclusivamente componentes funcionais e hooks.
- Preferir organização feature-based; não organizar por tipo técnico de arquivo.
- Manter um componente por arquivo e nomear arquivos de componente em `PascalCase`.
- Usar `index.ts` apenas para exportar API pública, nunca para lógica.
- Manter JSX focado em estrutura; extraia renderizações longas ou complexas.
- Desestruturar props na assinatura do componente.
- Usar `<>...</>` para evitar wrappers desnecessários.
- Se um componente acumular estado complexo ou múltiplos efeitos, extrair custom hook.
- Manter a ordem de hooks consistente: terceiros, custom hooks, estado local, efeitos.
- Usar early return para estados de loading, empty e error.
- Preferir `interface` para props e `type` para unions e utilitários.
- Declarar tipos de retorno de funções e hooks quando isso melhorar previsibilidade.
- Usar `clsx` ou `tailwind-merge` para classes condicionais.
- Nunca mutar estado diretamente.
- Manter arrays de dependência honestos e completos.
- Evitar `any`; o repositório opera com `TypeScript strict`.

## Performance e acessibilidade

- Preservar code splitting por rota.
- Evitar re-renders desnecessários; memoizar colunas de tabela e gráficos quando fizer sentido.
- Aplicar debounce em entradas que afetam listas, tabelas ou busca remota.
- Garantir foco visível e navegação por teclado em elementos interativos.

## Fluxo recomendado no Codex

1. Identificar se a mudança é local ao portal ou compartilhada.
2. Se for compartilhada, começar por `packages/ui` e/ou `packages/shared`.
3. Integrar primeiro no menor ponto possível de um portal.
4. Propagar para os demais portais sem duplicação.
5. Atualizar `AGENTS.md` e a skill relacionada quando houver mudança estrutural.
6. Executar as validações obrigatórias antes de encerrar.

## Checklist mínimo por mudança

- Executar `pnpm typecheck`.
- Executar `pnpm build` quando houver impacto em UI, roteamento ou composição relevante.
- Validar os três portais quando a alteração for visual ou compartilhada.
- Atualizar `README` e configuração de Docker se a mudança alterar execução ou estrutura.

## Comandos padrão

- Desenvolvimento geral: `pnpm dev`
- Desenvolvimento por portal:
  - `pnpm dev:customer`
  - `pnpm dev:supplier`
  - `pnpm dev:backoffice`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Format: `pnpm format`

## Anti-padrões

- Duplicar componentes do dashboard em `apps/*` quando já existe equivalente em `packages/ui/src/dashboard`.
- Criar schema inline sem `Zod` quando houver input, filtro ou contrato validável.
- Acoplar comportamento de feature dentro de `app/providers`.
- Romper lazy loading de rotas sem justificativa arquitetural.
- Adicionar dependência nova sem necessidade clara.

## Skills recomendadas

### `registra-portals-modular`

- Caminho: `.agents/skills/registra-portals-modular/SKILL.md`
- Quando usar: evolução de features, extração de reuso, padronização de layout/dashboard e revisão arquitetural do monorepo.
- Exemplos:
  - `Use $registra-portals-modular para criar a feature X no supplier.`
  - `Aplique registra-portals-modular para refatorar o dashboard compartilhado.`

### `react-best-practices`

- Caminho: `.agents/skills/react-best-practices/SKILL.md`
- Quando usar: escrita, revisão ou refatoração de código React com foco em performance e legibilidade.
- Exemplos:
  - `Use $react-best-practices para revisar performance do dashboard no customer.`
  - `Aplique react-best-practices para refatorar componentes com muitos re-renders.`

### `skill-creator`

- Caminho: `/Users/elourenco/.codex/skills/.system/skill-creator/SKILL.md`
- Quando usar: criação ou atualização de skills, referências e metadados de agentes.
- Exemplos:
  - `Use $skill-creator para atualizar a skill registra-portals-modular.`
  - `Aplique skill-creator para criar uma nova skill de integração OpenAPI.`

### `skill-installer`

- Caminho: `/Users/elourenco/.codex/skills/.system/skill-installer/SKILL.md`
- Quando usar: instalação de skills adicionais no ambiente Codex.
- Exemplos:
  - `Use $skill-installer para listar skills disponíveis.`
  - `Instale a skill X com skill-installer.`

## Atualizações estruturais

Sempre que houver mudança estrutural relevante, atualizar em conjunto:

- `AGENTS.md`
- `.agents/skills/registra-portals-modular/SKILL.md`
- `.agents/skills/registra-portals-modular/agents/openai.yaml`
