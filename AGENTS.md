# AGENTS.md

## Objetivo

Evoluir o monorepo frontend da Registra AI, composto pelos portais customer, supplier e backoffice, garantindo arquitetura modular, consistência visual entre aplicações, reutilização de componentes e alta qualidade de código, permitindo escalar a plataforma de forma sustentável.

O objetivo do produto é desenvolver uma plataforma SaaS para gerenciamento completo de processos de registro de imóveis, digitalizando e estruturando toda a jornada operacional que ocorre desde a abertura do processo até a emissão da matrícula registrada.

A plataforma atua como um sistema central de coordenação do processo de registro imobiliário, organizando documentos, etapas operacionais, solicitações e validações entre os diferentes participantes do processo.

O sistema conecta três atores principais:

Backoffice
Equipe operacional responsável por conduzir, validar e acompanhar os processos de registro, garantindo que cada etapa seja executada corretamente até a conclusão da matrícula.

Supplier
Clientes B2B da plataforma — como construtoras, bancos e incorporadoras — que utilizam o sistema para gerenciar seus empreendimentos, responder solicitações operacionais e fornecer documentos ou confirmações necessárias para o avanço do processo.

Comprador
Cliente final do imóvel, cujo processo de registro é acompanhado na plataforma até a transferência oficial da matrícula.

A plataforma organiza o fluxo de registro em workflows estruturados e rastreáveis, garantindo transparência, controle operacional e histórico completo das interações, reduzindo erros e acelerando a conclusão dos processos — algo essencial em operações imobiliárias complexas que tradicionalmente dependem de grande volume de documentos e validações manuais.

O objetivo final da Registra AI é transformar um processo historicamente burocrático e fragmentado em um sistema digital centralizado, colaborativo e escalável, permitindo que empresas operem centenas ou milhares de processos de registro simultaneamente com controle total da jornada.

## Baseline atual

- Stack principal: `React`, `Vite`, `TypeScript strict`, `Tailwind`, `React Router`, `TanStack Query`, `Zod`.
- Layout autenticado padronizado em `packages/ui/src/dashboard/portal-app-shell.tsx`.
- Dashboard compartilhado centralizado em `packages/ui/src/dashboard/*`.
- Schemas e mocks do dashboard centralizados em `packages/shared/src/dashboard/*`.
- Domínio operacional do backoffice de registro deve viver em `packages/shared/src/registration/*` quando precisar contratos, mocks e regras reutilizáveis.
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
- Para o backoffice operacional de registro, manter contratos e mocks em `src/registration/*`.

## Backoffice operacional

- A feature operacional do backoffice deve concentrar áreas de `Clientes`, `Empreendimentos`, `Compradores`, `Processos`, `Solicitações`, `Tarefas`, `Documentos`, `Exigências` e `Configurações`.
- A jornada do processo deve ficar no detalhe de processo, com os blocos `Certificado`, `Contrato` e `Registro`.
- Dependências entre blocos devem respeitar a ordem `Certificado -> Contrato -> Registro`, permitindo override manual apenas por ação explícita do backoffice.

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

## Atualizações do modelo de negócio
BPO (Business Process Outsourcing) Web Cartório

Explicação da dinâmica da plataforma SaaS

A plataforma SaaS existe para orquestrar e concluir o processo de registro de imóvel.

Ela conecta 3 atores principais:

Backoffice: equipe operacional da plataforma, responsável por conduzir o processo, validar informações, cobrar pendências, organizar documentos e garantir que o registro avance até a conclusão.

Supplier: cliente B2B da plataforma, como construtora, incorporadora ou banco. O supplier cadastra empreendimentos, unidades e compradores, e acompanha a carteira de processos.

Comprador: cliente final que adquiriu o imóvel e precisa enviar informações, documentos e respostas necessárias para viabilizar o registro.

O objetivo único da plataforma é:

fazer com que cada unidade vendida chegue ao status final de registro concluído.

Como a plataforma funciona na prática

O fluxo começa quando o supplier cadastra um empreendimento e suas unidades, e vincula os compradores correspondentes.

A partir disso, a plataforma cria ou prepara um processo de registro para cada imóvel/unidade.

Esse processo passa a ser conduzido pelo backoffice, que atua como operador central. O backoffice não apenas acompanha status: ele move o processo para frente.

Para concluir um registro imobiliário, normalmente são necessárias:

informações cadastrais do comprador

documentos pessoais ou societários

documentos complementares

formulários preenchidos

aceite de dados

correções de inconsistências

reapresentação de arquivos rejeitados

atendimento de exigências do cartório

Ou seja, o processo é naturalmente um fluxo de ida e volta, um verdadeiro ping-pong operacional.

Lógica da dinâmica Backoffice > Supplier > Comprador
1. Supplier inicia a base do processo

O supplier fornece a base estrutural do processo:

cadastro do empreendimento

cadastro da unidade

vínculo da unidade ao comprador

dados iniciais da operação

eventualmente documentos iniciais da venda

Nesse momento, o supplier “abre a porta” para o registro começar.

2. Backoffice assume a condução operacional

Depois disso, o backoffice passa a atuar como o operador da jornada.

Ele analisa o processo e identifica o que falta para o registro avançar.

Exemplos do que o backoffice pode precisar:

CPF/CNPJ correto

RG ou CNH legível

certidão atualizada

comprovante de estado civil

comprovante de endereço

dados do cônjuge

assinatura de formulário

correção de nome divergente

novo upload de documento vencido

resposta a uma exigência do cartório

O backoffice então transforma essas necessidades em solicitações objetivas dentro da plataforma.

3. Comprador responde às solicitações

O comprador recebe essas solicitações e precisa responder.

A resposta do comprador pode ser de vários tipos:

preencher um campo

confirmar uma informação

anexar um documento

reenviar um arquivo melhor

complementar dados

responder uma pendência específica

aceitar uma declaração

corrigir inconsistências

Ou seja, o comprador não usa a plataforma como navegador livre. Ele usa a plataforma como portal de pendências e respostas.

4. Backoffice valida o retorno

Quando o comprador responde, o backoffice analisa o retorno.

Se estiver tudo correto:

aprova a resposta

atualiza o status

move o processo para a próxima etapa

Se estiver incorreto, incompleto ou inválido:

rejeita ou devolve

explica o motivo

solicita novo envio

reabre a pendência

Esse ciclo se repete quantas vezes forem necessárias até que o processo fique apto para seguir ao cartório e concluir o registro.

O “ping-pong” operacional da plataforma

A plataforma deve ser pensada como um sistema de trocas controladas entre backoffice e comprador.

O backoffice envia:

solicitações

pedidos de documento

pedidos de correção

exigências

checkpoints

mensagens operacionais

devoluções com motivo

confirmação de aprovação

pedido de reenvido

O comprador devolve:

dados preenchidos

documentos

arquivos corrigidos

respostas

complementações

confirmações

aceite de informações

O resultado desse ping-pong:

Cada interação reduz incerteza e aproxima o processo do status final:
registro concluído.

O papel de cada ator
Backoffice

É o cérebro operacional da plataforma.

Responsabilidades:

abrir e conduzir processos

validar informações

identificar pendências

solicitar documentos e respostas

aprovar ou reprovar retornos

controlar SLA

organizar backlog operacional

consolidar o dossiê do processo

acompanhar exigências do cartório

garantir avanço até a conclusão

Supplier

É o originador da carteira.

Responsabilidades:

cadastrar empreendimentos

cadastrar unidades

cadastrar compradores

acompanhar andamento macro

eventualmente apoiar em exceções

garantir qualidade da base inicial

O supplier não deve operar o detalhe fino de cada documento, mas precisa ter visibilidade.

Comprador

É o responsável por fornecer as informações e documentos pessoais necessários para viabilizar o registro.

Responsabilidades:

responder solicitações

preencher dados

enviar documentos

reenviar arquivos rejeitados

corrigir pendências

acompanhar status da própria jornada

Como a IA deve entender a plataforma

A IA deve entender que essa plataforma não é um simples painel administrativo.

Ela é um workflow engine operacional focado em registro imobiliário.

O sistema precisa existir para:

organizar processos por unidade/comprador

transformar faltas em solicitações objetivas

permitir trocas estruturadas entre backoffice e comprador

registrar histórico completo das interações

controlar status e pendências

reduzir atraso operacional

garantir rastreabilidade documental

levar cada processo até o fim

Modelo mental correto para a IA

A forma mais correta de explicar para a IA é esta:

A plataforma funciona como uma esteira operacional de registro imobiliário.
O supplier cadastra a carteira inicial.
O backoffice conduz cada processo.
O comprador responde às pendências.
O backoffice valida e devolve se necessário.
Esse ciclo de solicitações e respostas acontece em formato de ping-pong até que toda a documentação e informações estejam corretas, permitindo o cumprimento das exigências e a conclusão do registro do imóvel.