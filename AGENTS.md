# AGENTS.md

## Objetivo do repositório
Evoluir o monorepo frontend da Registra AI com três portais (`customer`, `supplier`, `backoffice`) mantendo uma arquitetura modular, consistente e orientada a reuso.

## Estado atual do projeto (baseline para novas tarefas)
- Os três portais usam `React + Vite + TypeScript strict + Tailwind + React Router + TanStack Query + Zod`.
- O layout principal de área autenticada está padronizado via `PortalAppShell` em `packages/ui/src/dashboard/portal-app-shell.tsx`.
- O dashboard principal está centralizado em componentes compartilhados de `packages/ui/src/dashboard/*`.
- Os dados mock e schemas do dashboard estão centralizados em `packages/shared/src/dashboard/*`.
- As rotas principais dos portais já usam code splitting por rota (`lazy` no `router.tsx`).
- Há suporte de tema claro/escuro com persistência em `localStorage` (`registra-ai.theme`).
- Há suporte de sidebar colapsável com persistência por portal em `localStorage`.

## Regras de arquitetura (obrigatórias)
- Manter padrão modular por app: `app/`, `features/`, `widgets/`, `shared/`.
- Manter `app/` apenas para orquestração: providers, layout, roteamento e guards.
- Colocar abstrações de UI reutilizáveis em `packages/ui`.
- Colocar tipos, schemas Zod, helpers e regras de domínio frontend em `packages/shared`.
- Evitar duplicação entre portais: se repetir em 2+ apps, extrair para `packages/*`.
- Não acoplar regra de negócio de feature dentro de componentes de layout global.

## Regras de implementação (obrigatórias)
- Stack padrão: `React + Vite + TypeScript + React Router + TanStack Query + Zod + Motion + shadcn/ui`.
- Validar entrada de formulários e filtros com Zod.
- Modelar fluxos assíncronos (API/fetch) com TanStack Query.
- Garantir rotas protegidas via guard/layout centralizado.
- Garantir responsividade desktop/mobile.
- Priorizar componentes e padrões oficiais do shadcn/ui (`https://ui.shadcn.com/docs`).
- Sempre que possível, consultar MCP do shadcn e Context7 antes de implementar manualmente.
- Para integração de API real, consultar OpenAPI local: `http://localhost:3000/docs/` (registra-api).
- Manter visual profissional com animações leves e sem excesso.

## Convenções por camada
### `apps/*/src/app`
- Definir `router.tsx` com lazy loading por rota sempre que viável.
- Registrar providers globais em `providers/*`.
- Usar `layouts/protected-layout.tsx` apenas para composição de shell/autenticação.

### `apps/*/src/features`
- Organizar por feature (`<feature>/api`, `<feature>/components`, `<feature>/pages`, `<feature>/hooks`).
- Colocar chamadas de API e query hooks na própria feature.
- Manter páginas enxutas, delegando UI para componentes.

### `apps/*/src/widgets`
- Reservar para composições de widgets locais quando não fizer sentido promover para pacote compartilhado.

### `apps/*/src/shared`
- Manter constantes locais de rota/config do portal.
- Manter estilos globais e tokens específicos do portal.

### `packages/ui`
- Reunir componentes base de design system (`button`, `card`, `sheet`, `table`, etc.).
- Reunir componentes cross-portal de dashboard/layout em `src/dashboard/*`.
- Exportar tudo por `src/index.ts`.

### `packages/shared`
- Reunir schemas Zod, tipos e helpers de domínio.
- Reunir contrato do dashboard em `src/dashboard/dashboard-schema.ts`.
- Reunir API mock do dashboard em `src/dashboard/dashboard-mock-api.ts`.

## Diretrizes específicas do dashboard compartilhado
- Página `/dashboard` de cada portal deve preferir `DashboardModule` de `@registra/ui`.
- Layout autenticado deve preferir `PortalAppShell` de `@registra/ui`.
- Sidebar por portal deve ser declarada no `ProtectedLayout` do app, via `SidebarSection[]`.
- Tabela de transações deve manter:
  - sorting
  - filtros por status/categoria
  - busca com debounce
  - paginação
  - abertura de detalhe em Sheet
- Estados obrigatórios:
  - loading com skeleton
  - empty state com CTA
  - error state com retry

## Performance e qualidade
- Preservar code splitting por rota.
- Evitar re-render desnecessário (memoizar colunas de tabela e gráfico quando aplicável).
- Usar debounce em inputs que impactam tabela/lista.
- Evitar `any`; tipar tudo com TypeScript strict.
- Garantir foco e navegação por teclado em elementos interativos.

## Fluxo recomendado de implementação no Codex
1. Mapear se a mudança é local de portal ou compartilhada.
2. Se compartilhada, começar por `packages/ui` e/ou `packages/shared`.
3. Implementar integração mínima em um portal.
4. Propagar para os demais portais sem duplicação.
5. Atualizar `AGENTS.md` e skill relevante quando houver mudança estrutural.
6. Executar validações obrigatórias.

## Qualidade mínima por mudança
- Executar `pnpm typecheck`.
- Executar `pnpm build` quando houver alteração relevante de UI/roteamento.
- Em alteração visual relevante, validar os três portais.
- Manter README e Docker atualizados quando a mudança alterar execução/estrutura.

## Comandos operacionais padrão
- Dev geral: `pnpm dev`
- Dev por portal:
  - `pnpm dev:customer`
  - `pnpm dev:supplier`
  - `pnpm dev:backoffice`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`
- Lint/format (Biome):
  - `pnpm lint`
  - `pnpm format`

## Anti-padrões a evitar
- Duplicar componentes do dashboard em `apps/*` quando já existe equivalente em `packages/ui/src/dashboard`.
- Criar schema inline sem Zod quando há validação de input/filtro.
- Acoplar comportamento de feature dentro de `app/providers`.
- Quebrar padrão de rotas lazy sem justificativa de arquitetura.
- Adicionar dependência nova sem necessidade clara.

## Skills recomendadas
- `registra-portals-modular`
  - Caminho: `.agents/skills/registra-portals-modular/SKILL.md`
  - Usar para evoluir features dos portais com arquitetura modular, reuso entre apps e padronização de dashboard/layout.
  - Exemplos de acionamento:
  - `Use $registra-portals-modular para criar a feature X no supplier.`
  - `Aplique registra-portals-modular para refatorar o dashboard compartilhado.`
- `react-best-practices`
  - Caminho: `.agents/skills/react-best-practices/SKILL.md`
  - Usar para escrita, revisão e refatoração de código React com foco em performance e padrões recomendados.
  - Exemplos de acionamento:
  - `Use $react-best-practices para revisar performance do dashboard no customer.`
  - `Aplique react-best-practices para refatorar componentes com muitos re-renders.`
- `skill-creator`
  - Caminho global: `/Users/elourenco/.codex/skills/.system/skill-creator/SKILL.md`
  - Usar para criar ou atualizar skills, referências e metadados de `agents/openai.yaml`.
  - Exemplos de acionamento:
  - `Use $skill-creator para atualizar a skill registra-portals-modular.`
  - `Aplique skill-creator para criar uma nova skill de integração OpenAPI.`
- `skill-installer`
  - Caminho global: `/Users/elourenco/.codex/skills/.system/skill-installer/SKILL.md`
  - Usar para instalar skills adicionais no ambiente Codex.
  - Exemplos de acionamento:
  - `Use $skill-installer para listar skills disponíveis.`
  - `Instale a skill X com skill-installer.`

## Nota para futuras atualizações
Sempre que houver mudança estrutural importante (layout base, convenção de rotas, contrato de dados compartilhados, novos pacotes), atualizar em conjunto:
- `AGENTS.md`
- `.agents/skills/registra-portals-modular/SKILL.md`
- `.agents/skills/registra-portals-modular/agents/openai.yaml`
