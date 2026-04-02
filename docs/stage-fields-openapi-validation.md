# Validação OpenAPI de `stageId` e `stageName`

Data da validação: 2026-04-01

## Endpoints confirmados na OpenAPI

- `GET /api/v1/buyers/process`
  - Schema documentado: `AuthenticatedBuyerProcessesResponse`
  - `BuyerProcessSummary` já expõe `stageId` e `stageName`
  - Impacto: portal customer deve consumir `stageId` e `stageName` como contrato principal

- `GET /api/v1/backoffice/processes`
  - Schema documentado: `BackofficeProcessListResponse`
  - `BackofficeProcessListItem` já expõe `stageId` e `stageName`
  - Impacto: portal backoffice deve normalizar a lista usando os novos nomes

- `GET /api/v1/workflows/processes/{processId}`
  - Schema documentado: `SupplierProcessDetail`
  - `SupplierProcessSummary` documenta `stageId`
  - `stageName` pode continuar sendo inferido por `stages` ou payload legado quando ausente
  - Impacto: portal backoffice deve aceitar `stageId` e manter fallback de `stageName`

- `GET /api/v1/developments/{developmentId}`
  - Schema documentado: `DevelopmentDetailResponse`
  - `DevelopmentProcessSummary` já expõe `stageId` e `stageName`
  - Impacto: portal supplier pode consumir `stageName` no detalhe de empreendimento

- `GET /api/v1/buyers/{buyerId}`
  - Schema documentado: `BuyerDetailResponse`
  - Os itens de `processes` já expõem `stageId` e `stageName`
  - Impacto: portal supplier pode consumir `stageId` e `stageName` no detalhe do comprador

- `GET /api/v1/workflows/suppliers/{supplierCompanyId}/processes`
  - Schema documentado: `SupplierProcessListResponse`
  - `SupplierProcessSummary` documenta `stageId`, mas não documenta `stageName`
  - Impacto: backoffice precisa manter fallback para derivar `stageName` via payload legado ou etapa ativa

## Gaps documentais encontrados

- Os paths `/api/v1/suppliers/{supplierId}/developments/{developmentId}` e `/api/v1/suppliers/{supplierId}/buyers/{buyerId}` não aparecem na OpenAPI oficial.
- Os defaults reais do portal supplier usam `/api/v1/developments/{developmentId}` e `/api/v1/buyers/{buyerId}`, que estão documentados.
- `SupplierProcessSummary` ainda não documenta `stageName`, apenas `stageId`.

## Diretriz adotada no frontend

- O contrato interno dos portais passa a usar `stageId` e `stageName`.
- Adapters continuam aceitando `currentStageId`, `currentStageName`, `currentStepName` e `stepName` durante a transição.
- Não foi criado mock silencioso para preencher ausência de documentação; os gaps acima ficam registrados para alinhamento da API.
