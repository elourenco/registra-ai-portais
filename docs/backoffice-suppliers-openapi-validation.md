# Backoffice Suppliers OpenAPI Validation

Data da validação: 2026-03-14  
Fonte: `http://localhost:3000/docs/`

## Endpoints confirmados na OpenAPI

- `GET /api/v1/supplier/companies`
- `GET /api/v1/supplier/companies/{supplierCompanyId}`
- `GET /api/v1/developments`
- `GET /api/v1/developments/{developmentId}`

## Validação HTTP real no servidor local

Data da validação real: 2026-03-14

Sem token, a API respondeu `401` para:

- `GET /api/v1/supplier/companies?page=1&limit=10`
- `GET /api/v1/supplier/companies/1`
- `GET /api/v1/developments?page=1&limit=10&supplierId=1`
- `GET /api/v1/developments/1`

Isso confirma que as rotas documentadas no Swagger estão publicadas no servidor local e protegidas por autenticação.

## Cobertura aplicada no frontend do backoffice

- `suppliers-page`
  - lista 100% via `GET /api/v1/supplier/companies`
  - filtros `page`, `limit`, `cnpj`, `name`, `status` alinhados com a OpenAPI
  - navegação preservada por click na linha, sem coluna de ação
- `supplier-detail-page`
  - cabeçalho via `GET /api/v1/supplier/companies/{supplierCompanyId}`
  - lista de empreendimentos via `GET /api/v1/developments?supplierId=...`
  - contexto do empreendimento selecionado via `GET /api/v1/developments/{developmentId}`

## Schemas validados contra a OpenAPI

- `SupplierCompanyPaginatedListResponse`
- `SupplierCompanyDetail`
- `DevelopmentListResponse`
- `DevelopmentDetailResponse`
- `DevelopmentBuyerSummary`
- `DevelopmentProcessSummary`

## Gap confirmado para a UX atual

O layout atual da tabela de compradores no detalhe do supplier possui a coluna `Etapa atual`, mas o schema `DevelopmentProcessSummary` documentado na OpenAPI retorna apenas:

- `id`
- `name`
- `status`
- `createdAt`

O endpoint atual não documenta `currentStepName`, `currentStageName` ou equivalente no contexto de `GET /api/v1/developments/{developmentId}`.  
No frontend, a coluna continua existindo para preservar o layout, mas fica em fallback `-` quando a API não envia esse dado.
