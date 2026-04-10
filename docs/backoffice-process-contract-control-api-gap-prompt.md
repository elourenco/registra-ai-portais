# API Feature Request

Contexto:
O portal backoffice, na etapa de geração do contrato do detalhe do processo, precisa operar de forma parecida com a etapa de emissão do certificado:

- aguardar o envio do documento da etapa
- validar o status do documento
- registrar a URL externa de assinatura do contrato
- registrar um status operacional específico do contrato

A OpenAPI atual já cobre:

- `GET /api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}`
- `PATCH /api/v1/documents/{documentId}/status`
- `POST /api/v1/workflows/processes/{processId}/advance`
- `POST /api/v1/workflows/processes/{processId}/stages/{stageId}/notes`

Mas o contrato atual do detalhe do processo não expõe campos persistidos para controle operacional do contrato dentro da etapa de contrato. O schema `SupplierProcessStageStatus.process` retorna apenas os metadados do processo e `documents`.

Portal afetado:
backoffice

Objetivo:
Permitir que o backoffice salve e consulte o controle operacional da etapa de contrato, com URL de assinatura e status dedicado, sem depender de observação textual solta.

## Gap identificado

No `GET /api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}` faltam campos como:

- `signatureUrl`
- `contractControlStatus`
- `contractControlUpdatedAt`
- `contractControlUpdatedBy`

Também não existe endpoint explícito para atualizar esses campos no processo da etapa de contrato.

## Endpoint sugerido 1

PATCH /api/v1/workflows/processes/{processId}/contract-control

Request schema:

```json
{
  "stageId": "string",
  "signatureUrl": "string | null",
  "contractControlStatus": "pending_generation | awaiting_document_upload | awaiting_signature | signed | completed | cancelled"
}
```

Response schema:

```json
{
  "processId": "string",
  "stageId": "string",
  "signatureUrl": "string | null",
  "contractControlStatus": "pending_generation | awaiting_document_upload | awaiting_signature | signed | completed | cancelled",
  "updatedAt": "date-time",
  "updatedBy": {
    "id": "string",
    "name": "string"
  }
}
```

Regras de negócio:

- Deve permitir atualização apenas para a etapa de contrato do workflow.
- `signatureUrl` deve aceitar `null` para limpeza explícita.
- `signatureUrl`, quando enviada, deve ser validada como URL absoluta.
- `contractControlStatus` deve aceitar apenas valores previstos em enum.
- A atualização deve registrar trilha auditável.
- A atualização deve refletir imediatamente no detalhe do processo.

## Endpoint sugerido 2

Evolução do payload de:

GET /api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}

Campos sugeridos dentro de cada `stage.process` da etapa de contrato:

```json
{
  "id": "string",
  "status": "in_progress | completed | cancelled | not_started",
  "documents": [],
  "contractControl": {
    "signatureUrl": "string | null",
    "status": "pending_generation | awaiting_document_upload | awaiting_signature | signed | completed | cancelled",
    "updatedAt": "date-time",
    "updatedBy": {
      "id": "string",
      "name": "string"
    }
  }
}
```

Regras de negócio:

- `contractControl` pode ser `null` para etapas que não sejam de contrato.
- Para a etapa de contrato, o ideal é sempre retornar a estrutura preenchida, mesmo com `signatureUrl: null`.
- O frontend precisa consumir esses dados junto com `documents` para montar o card operacional completo da etapa.

## Lista de status sugerida

- `pending_generation`: contrato ainda não foi preparado
- `awaiting_document_upload`: backoffice aguarda o documento do contrato
- `awaiting_signature`: contrato enviado para assinatura
- `signed`: contrato assinado
- `completed`: controle contratual encerrado
- `cancelled`: contrato cancelado/inutilizado

Observações de integração:

- O frontend já usa o detalhe do processo por etapa e a atualização do status documental.
- O comportamento esperado é reaproveitar a mesma UX de validação documental da etapa de certificado, adicionando o bloco de controle do contrato.
- Se o backend preferir evitar endpoint novo, o `PATCH /api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}` pode ser expandido, desde que o contrato deixe explícito:
  - qual etapa está sendo atualizada
  - quais campos pertencem ao controle do contrato
  - qual enum de status é suportado
