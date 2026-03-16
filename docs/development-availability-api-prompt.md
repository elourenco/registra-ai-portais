# Prompt para o projeto da API

Implemente o suporte de backend para disponibilidade da volumetria de empreendimentos no projeto da API da Registra AI.

## Contexto de negócio

A plataforma precisa deixar de tratar a unidade/lote como texto livre no comprador. O supplier deve gerenciar a volumetria do empreendimento e o comprador precisa ser vinculado a uma unidade real disponível. O backoffice precisa ler esse vínculo de forma auditável.

Hoje a API aceita `unitLabel` no `POST /api/v1/buyers`, mas ainda não possui:

- entidade própria de disponibilidade da volumetria
- CRUD para unidades/lotes do empreendimento
- vínculo forte por `availabilityItemId`
- resumo de disponibilidade no detalhe do empreendimento

## Objetivo

Adicionar um subdomínio de disponibilidade do empreendimento, com contratos, persistência, validação e OpenAPI, preservando compatibilidade com `unitLabel`.

## Requisitos de domínio

Criar uma entidade `DevelopmentAvailabilityItem` com os campos mínimos:

- `id`
- `developmentId`
- `displayLabel`
- `status`: `available | reserved | sold | blocked`
- `structureType`: `simple | tower_unit | block_unit | block_lot`
- `metadata`
- `buyerId`
- `processId`
- `blockedReason`
- `createdAt`
- `updatedAt`

`metadata` deve suportar:

- vertical: `tower`, `floor`, `unitNumber`
- horizontal: `block`, `unitNumber`
- loteamento: `block`, `lot`
- condomínio de lotes: `block`, `lot`

`displayLabel` deve ser derivado da estrutura e não depender de digitação livre.

## Endpoints necessários

Adicionar endpoints autenticados:

1. `GET /api/v1/developments/{developmentId}/availability`
- lista a disponibilidade do empreendimento
- suporta filtros por `status`, `search`, `structureType`
- retorna `items` e `summary`

2. `POST /api/v1/developments/{developmentId}/availability`
- cria uma unidade/lote manualmente

3. `POST /api/v1/developments/{developmentId}/availability/generate`
- gera disponibilidade em lote conforme a estrutura
- payload deve aceitar:
  - `structureType`
  - `prefix`
  - `totalUnits`
  - `totalTowers`
  - `unitsPerTower`
  - `totalBlocks`
  - `unitsPerBlock`
  - `lotsPerBlock`

4. `PATCH /api/v1/developments/{developmentId}/availability/{itemId}`
- atualiza status e dados permitidos do item

5. `DELETE /api/v1/developments/{developmentId}/availability/{itemId}`
- remove um item de volumetria
- só pode excluir item sem comprador e sem processo vinculado
- rejeitar exclusão de item `reserved` ou `sold`

6. `POST /api/v1/developments/{developmentId}/availability/{itemId}/assign-buyer`
- vincula comprador à unidade
- rejeita se a unidade já estiver ocupada

7. `POST /api/v1/developments/{developmentId}/availability/{itemId}/release-buyer`
- desfaz vínculo com auditoria

## Ajustes no domínio de comprador

Atualizar `POST /api/v1/buyers` para aceitar:

- `availabilityItemId` opcional

Regras:

- se `availabilityItemId` for informado, validar que o item pertence ao mesmo `developmentId`
- se o item estiver `reserved`, `sold` ou `blocked`, rejeitar
- ao criar comprador com `availabilityItemId`, preencher `unitLabel` automaticamente com `displayLabel`
- manter `unitLabel` no response por compatibilidade

Atualizar `GET /api/v1/buyers/{buyerId}` para retornar:

- `availabilityItemId`
- resumo da unidade vinculada

## Ajustes no detalhe do empreendimento

Atualizar `GET /api/v1/developments/{developmentId}` para retornar também:

- `availabilitySummary`

Resumo mínimo:

- `total`
- `available`
- `reserved`
- `sold`
- `blocked`

## Regras de consistência

- impedir dois compradores ativos na mesma unidade
- impedir dois processos ativos para a mesma unidade sem override explícito
- manter trilha de auditoria para bloqueio, liberação e reatribuição
- ao excluir ou regenerar disponibilidade, proteger itens já vinculados

## OpenAPI

Atualizar a documentação Swagger/OpenAPI com:

- schemas de `DevelopmentAvailabilityItem`
- schemas de request/response dos endpoints novos
- atualização de `BuyerCreateInput`
- exemplos reais de payload

## Compatibilidade

Durante a transição:

- `unitLabel` continua existindo
- `availabilityItemId` passa a ser a fonte de verdade
- responses devem continuar incluindo `unitLabel`

## Entrega esperada

Quero receber:

- migrações ou alterações de persistência
- controllers/routes/services necessários
- validações
- OpenAPI atualizada
- testes cobrindo:
  - geração de volumetria
  - criação manual
  - vínculo com comprador
  - bloqueio de duplicidade
  - compatibilidade com `unitLabel`
