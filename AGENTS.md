# AGENTS.md

## Objetivo do repositório
Monorepo frontend da Registra AI com três portais (`customer`, `supplier`, `backoffice`) compartilhando componentes e utilitários.

## Regras de arquitetura
- Manter padrão modular por app: `app/`, `features/`, `widgets/`, `shared/`.
- Colocar abstrações reutilizáveis de UI em `packages/ui`.
- Colocar tipos, schemas e helpers de domínio frontend em `packages/shared`.
- Evitar lógica de feature dentro de `app/`; `app/` deve orquestrar providers, layouts e roteamento.
- Evitar duplicação entre portais: extrair para `packages/*` quando repetido em 2+ apps.

## Regras de implementação
- Stack padrão: React + Vite + TypeScript + React Router + TanStack Query + Zod + Motion + shadcn/ui.
- Toda validação de formulário deve usar Zod.
- Fluxos assíncronos (API/fetch) devem usar TanStack Query.
- Rotas protegidas devem passar por layout/guard centralizado.
- Garantir responsividade desktop/mobile.
- Para UI, priorizar componentes e padrões da documentação oficial do shadcn/ui (`https://ui.shadcn.com/docs`) e exemplos oficiais (ex.: dashboard).
- Sempre que possível, usar MCP do shadcn para consultar documentação/registry durante a implementação.

## Qualidade mínima por mudança
- Atualizar tipagens e evitar `any`.
- Executar `pnpm typecheck`.
- Quando houver mudança visual relevante, validar as três apps.
- Manter README e Docker atualizados se mexer em estrutura de execução.

## Skills recomendados
- Use `registra-portals-modular` para implementar features seguindo este padrão.
- Use `skill-creator` quando precisar criar/ajustar skills.
- Use `skill-installer` para instalar skills adicionais no ambiente Codex.
