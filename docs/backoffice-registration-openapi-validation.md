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
- `GET /api/v1/documents`
- `PATCH /api/v1/documents/{documentId}/status`
- `GET /api/v1/documents/{documentId}/download`
- `GET /api/v1/requests`
- `GET /api/v1/tasks`
- `GET /api/v1/requirements`

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
  - endpoints auxiliares por `processId` existem para solicitações, tarefas, exigências e documentos
  - não cobre paginação nem busca textual
  - não cobre histórico, notificações nem arquivos compartilhados do detalhe operacional

## Gaps confirmados na OpenAPI para a UX atual do backoffice

- `dashboard`
  - não existe endpoint agregado com métricas operacionais
- `developments`
  - não existe `GET` de lista global nem detalhe por empreendimento
- `buyers`
  - não existe endpoint documentado de lista, detalhe ou cadastro
- `process detail`
  - o endpoint real de workflow retorna `buyer` e `documents` por etapa
  - histórico, notificações e arquivos compartilhados seguem sem contrato documentado
- `process list`
  - o endpoint real não retorna paginação
  - o endpoint real não retorna filtro textual
  - o endpoint real não retorna `supplierName`, `workflowName` nem `currentStageName` de forma consistente no schema documentado

## Decisão aplicada nesta refatoração

- Remover o acoplamento estrutural com `features/operations`
- Migrar para API real o que a OpenAPI já suporta hoje
- Manter mock encapsulado em `features/registration-core` apenas para as telas cujo contrato ainda não existe no backend
- Não inventar endpoints inexistentes no frontend
