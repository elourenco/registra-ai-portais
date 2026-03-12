# Backoffice Registration OpenAPI Validation

Data da validação: 2026-03-11  
Fonte: `http://localhost:3000/docs/swagger-ui-init.js`

## Endpoints confirmados na OpenAPI

- `GET /api/v1/supplier/companies`
- `POST /api/v1/supplier/companies`
- `GET /api/v1/supplier/companies/{supplierCompanyId}`
- `PATCH /api/v1/supplier/companies/{supplierCompanyId}`
- `PATCH /api/v1/supplier/companies/{supplierCompanyId}/workflow`
- `POST /api/v1/developments`
- `GET /api/v1/workflows/suppliers/{supplierCompanyId}/processes`
- `POST /api/v1/workflows/suppliers/{supplierCompanyId}/processes`
- `GET /api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}`
- `PATCH /api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}`
- `GET /api/v1/workflows/processes`
- `GET /api/v1/workflows/processes/{processId}`

## Cobertura atual no frontend

- `suppliers`
  - lista e detalhe cobertos por API real
  - filtros `page`, `limit`, `cnpj`, `name`, `status` confirmados
- `developments`
  - criação coberta por API real
  - lista e detalhe ainda sem endpoint documentado
- `processes`
  - OpenAPI expõe lista global e detalhe simples de processos de workflow
  - payload real cobre `id`, `supplierCompanyId`, `name`, `status`, `workflow`, `stages`, `createdAt` e `updatedAt`
  - não cobre paginação nem busca textual
  - não cobre o contrato rico atual de detalhe operacional usado na UI de registro

## Gaps confirmados na OpenAPI para a UX atual do backoffice

- `dashboard`
  - não existe endpoint agregado com métricas operacionais
- `developments`
  - não existe `GET` de lista global nem detalhe por empreendimento
- `buyers`
  - não existe endpoint documentado de lista, detalhe ou cadastro
- `requests`
  - não existe endpoint documentado
- `tasks`
  - não existe endpoint documentado
- `documents`
  - não existe endpoint documentado para lista, upload, download ou validação
- `requirements`
  - não existe endpoint documentado
- `process detail`
  - o endpoint real de workflow não retorna `buyer`, `development`, `documents`, `requirements`, `history`, `notifications` nem `sharedFiles`
- `process list`
  - o endpoint real não retorna paginação
  - o endpoint real não retorna filtro textual
  - o endpoint real não retorna `supplierName`, `workflowName` nem `currentStageName` de forma consistente no schema documentado

## Decisão aplicada nesta refatoração

- Remover o acoplamento estrutural com `features/operations`
- Migrar para API real o que a OpenAPI já suporta hoje
- Manter mock encapsulado em `features/registration-core` apenas para as telas cujo contrato ainda não existe no backend
- Não inventar endpoints inexistentes no frontend
