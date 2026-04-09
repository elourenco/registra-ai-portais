# API Feature Request

Contexto:
O portal backoffice já consome endpoints reais para detalhe do processo, documentos, solicitações, tarefas e exigências. A tela de detalhe do processo ainda possui lacunas para histórico auditável da jornada, notificações disparadas e arquivos compartilhados pelo backoffice com supplier/comprador.

Portal afetado:
backoffice

Objetivo:
Remover completamente dependências de mock na tela de detalhe do processo, preservando os blocos de histórico, notificações e arquivos compartilhados com dados reais.

## Endpoint sugerido 1

GET /api/v1/processes/{processId}/history

Response schema:

```json
{
  "items": [
    {
      "id": "string",
      "processId": "string",
      "occurredAt": "date-time",
      "user": "string",
      "action": "string",
      "note": "string",
      "comment": "string | null"
    }
  ]
}
```

Regras de negócio:

- Deve retornar eventos em ordem decrescente por `occurredAt`.
- Deve incluir alterações manuais de status, validação documental, criação/conclusão de tarefas, exigências e compartilhamento de arquivos.
- Deve ser auditável e imutável.

## Endpoint sugerido 2

GET /api/v1/processes/{processId}/notifications

Response schema:

```json
{
  "items": [
    {
      "id": "string",
      "processId": "string",
      "recipient": "supplier | buyer | backoffice",
      "title": "string",
      "description": "string",
      "createdAt": "date-time"
    }
  ]
}
```

Regras de negócio:

- Deve listar notificações efetivamente disparadas no contexto do processo.
- Deve suportar destinatários `supplier`, `buyer` e `backoffice`.

## Endpoint sugerido 3

GET /api/v1/processes/{processId}/shared-files

Response schema:

```json
{
  "items": [
    {
      "id": "string",
      "processId": "string",
      "block": "certificate | contract | registration",
      "audience": "supplier | buyer | both",
      "title": "string",
      "description": "string",
      "fileName": "string",
      "fileUrl": "string",
      "uploadedBy": "string",
      "createdAt": "date-time"
    }
  ]
}
```

## Endpoint sugerido 4

POST /api/v1/processes/{processId}/shared-files

Request schema:

```json
{
  "block": "certificate | contract | registration",
  "audience": "supplier | buyer | both",
  "title": "string",
  "description": "string",
  "file": "multipart binary"
}
```

Response schema:

Mesmo contrato de item do endpoint de listagem.

Regras de negócio:

- Deve registrar evento no histórico.
- Deve disparar notificações conforme `audience`.
- Deve versionar/substituir arquivo quando aplicável.

Observações de integração:

- O frontend do backoffice já usa `GET /api/v1/workflows/processes/{processId}`, `GET /api/v1/requests`, `GET /api/v1/tasks`, `GET /api/v1/requirements`, `GET /api/v1/documents` e `PATCH /api/v1/documents/{documentId}/status`.
- Esses novos endpoints precisam aceitar contexto `x-portal: backoffice`.
- Ideal manter formato paginado opcional (`items` + `pagination`) para consistência com os demais endpoints.
