# Delivery Checklist

## 1) Checklist técnico obrigatório
- Executar `pnpm typecheck`.
- Executar `pnpm build` para apps impactadas.
- Verificar que não foi introduzido `any` sem justificativa.
- Verificar que schemas Zod continuam cobrindo inputs e filtros.
- Verificar que queries continuam em TanStack Query.

## 2) Checklist de arquitetura
- Confirmar que código repetido em 2+ apps foi extraído para `packages/*`.
- Confirmar que `app/` não recebeu lógica de feature indevida.
- Confirmar que rotas protegidas continuam centralizadas no layout guard.
- Confirmar que componentes base compartilhados estão exportados em `packages/ui/src/index.ts`.

## 3) Checklist de UX/responsividade
- Conferir desktop e mobile nos portais afetados.
- Conferir navegação por teclado em elementos interativos principais.
- Conferir foco visível e labels acessíveis.
- Conferir estados loading/empty/error/retry em telas de dados.

## 4) Checklist de documentação
Atualizar quando necessário:
- `AGENTS.md` para mudanças estruturais.
- `.codex/skills/registra-portals-modular/SKILL.md` para mudança de workflow arquitetural.
- `.codex/skills/registra-portals-modular/agents/openai.yaml` para metadados do agente da skill.
- `README.md` e Docker quando mudança afeta execução local/CI.

## 5) Checklist de revisão final
- Conferir `git diff` focando regressões e duplicações.
- Garantir consistência de nomenclatura de arquivos e funções.
- Garantir mensagens de erro úteis e recovery path (`retry`) onde aplicável.
- Garantir compatibilidade com TypeScript strict.
