# Layout Review Checklist

## 1) Shell e navegação
- Confirmar uso de `PortalAppShell` para área autenticada.
- Confirmar que `ProtectedLayout` está apenas orquestrando composição/guard.
- Confirmar sidebar por portal declarada via `SidebarSection[]`.
- Confirmar comportamento correto de colapso da sidebar e persistência em `localStorage`.
- Confirmar modo mobile com sidebar em `Sheet`.

## 2) Hierarquia visual
- Confirmar presença clara de: contexto da página, ações principais e conteúdo.
- Confirmar consistência de espaçamento entre seções.
- Confirmar alinhamento consistente de títulos, filtros e ações.
- Confirmar que tabelas/cards não competem por destaque visual indevido.

## 3) Estados de tela
- Confirmar loading com skeleton proporcional ao layout real.
- Confirmar empty state com CTA acionável.
- Confirmar error state com ação de retry.
- Confirmar ausência de layout shift perceptível na transição de estados.

## 4) Acessibilidade
- Confirmar landmarks (`header`, `nav`, `main`) presentes na estrutura principal.
- Confirmar navegação completa por teclado em sidebar, header, tabelas e sheets.
- Confirmar foco visível em todos os elementos interativos relevantes.
- Confirmar labels/`aria-label` em botões somente com ícone.
- Confirmar contraste legível em claro/escuro.

## 5) Responsividade
- Confirmar funcionamento em desktop e mobile nos portais impactados.
- Confirmar ausência de overflow horizontal crítico.
- Confirmar que ações primárias continuam acessíveis em telas menores.
- Confirmar legibilidade de tabela/listas em largura reduzida.

## 6) Performance e arquitetura
- Confirmar manutenção de lazy loading por rota no `router.tsx`.
- Confirmar ausência de duplicação de layout em `apps/*` quando pode estar em `packages/ui`.
- Confirmar que regras de feature não foram movidas para `app/` ou para shell compartilhado.
- Confirmar ausência de `any` novo em mudanças de layout/integração.

## 7) Verificações finais
- Executar `pnpm typecheck`.
- Executar `pnpm build` para apps impactadas quando houve mudança relevante de UI/rota.
- Revisar regressão visual nos três portais quando a base compartilhada foi alterada.
- Atualizar `AGENTS.md` e skill quando houver mudança estrutural.
