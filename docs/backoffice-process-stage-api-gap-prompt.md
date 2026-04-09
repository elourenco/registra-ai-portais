# API Feature Request

Contexto:
O portal backoffice já consome o detalhe real de processos via `GET /api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}`, além de validação documental via `PATCH /api/v1/documents/{documentId}/status`. A UX da tela de detalhe do processo evoluiu para permitir duas ações operacionais por etapa:

- registrar observação textual do backoffice na etapa atual
- concluir a etapa atual e avançar o workflow para a próxima etapa

Hoje a OpenAPI expõe apenas:

- `PATCH /api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}` com `status: completed | cancelled`
- `POST /api/v1/workflows/suppliers/{supplierCompanyId}/processes` com `name` e `workflowId`

Esses contratos não resolvem completamente a necessidade da UX porque:

- não existe endpoint dedicado para persistir observação textual da etapa
- não existe endpoint transacional para concluir a etapa atual e abrir a próxima de forma explícita
- o `POST` atual não permite indicar qual etapa deve ser iniciada nem garantir semanticamente que o novo processo volte já em `in_progress`

Portal afetado:
backoffice

Objetivo:
Permitir que o backoffice registre observações operacionais por etapa e avance o workflow com rastreabilidade, sem depender de composição frágil entre endpoints genéricos.

## Endpoint sugerido 1

POST /api/v1/workflows/processes/{processId}/stages/{stageId}/notes

Request schema:

```json
{
  "note": "string"
}
```

Response schema:

```json
{
  "id": "string",
  "processId": "string",
  "stageId": "string",
  "note": "string",
  "createdAt": "date-time",
  "createdBy": {
    "id": "string",
    "name": "string"
  }
}
```

Regras de negócio:

- Deve registrar observação vinculada à etapa atual do workflow.
- Deve aceitar múltiplas observações por etapa, preservando histórico auditável.
- Deve registrar usuário autor, data e hora.
- Deve aparecer em futuras consultas do detalhe do processo ou em endpoint de histórico.
- Não deve sobrescrever automaticamente observações anteriores.

## Endpoint sugerido 2

POST /api/v1/workflows/processes/{processId}/advance

Request schema:

```json
{
  "currentStageId": "string",
  "observation": "string | null"
}
```

Response schema:

```json
{
  "completedProcess": {
    "id": "string",
    "status": "completed",
    "stageId": "string",
    "completedAt": "date-time"
  },
  "nextProcess": {
    "id": "string",
    "status": "in_progress",
    "stageId": "string",
    "createdAt": "date-time"
  },
  "stages": [
    {
      "id": "string",
      "name": "string",
      "order": 1,
      "status": "pending | in_progress | completed",
      "process": {
        "id": "string",
        "status": "not_started | in_progress | completed | cancelled"
      }
    }
  ]
}
```

Regras de negócio:

- Deve validar que `currentStageId` corresponde à etapa atualmente em andamento.
- Deve concluir o processo da etapa atual antes de abrir a próxima.
- Deve criar automaticamente o processo da próxima etapa do mesmo workflow.
- O processo da próxima etapa deve nascer em `in_progress`.
- Se `observation` vier preenchida, deve persisti-la no mesmo fluxo transacional.
- Se não existir próxima etapa, o endpoint pode:
  - concluir apenas a etapa atual e devolver o workflow encerrado; ou
  - retornar resposta explícita informando que a última etapa foi finalizada.
- A operação deve ser idempotente o suficiente para evitar criação duplicada da próxima etapa em caso de retry.
- Deve registrar evento auditável no histórico do processo.

## Endpoint sugerido 3

GET /api/v1/workflows/processes/{processId}/stages/{stageId}/notes

Response schema:

```json
{
  "items": [
    {
      "id": "string",
      "processId": "string",
      "stageId": "string",
      "note": "string",
      "createdAt": "date-time",
      "createdBy": {
        "id": "string",
        "name": "string"
      }
    }
  ]
}
```

Regras de negócio:

- Deve retornar observações em ordem decrescente por `createdAt`.
- Deve permitir ao frontend reconstruir a trilha textual da etapa.

Observações de integração:

- O frontend do backoffice já envia `x-portal: backoffice` em todas as requisições.
- Ideal que o `GET /api/v1/workflows/suppliers/{supplierCompanyId}/processes/{processId}` passe a refletir imediatamente o avanço da etapa após a operação.
- Se o backend preferir evitar novos endpoints de leitura, o payload do detalhe do processo pode passar a incluir `notes` por etapa.
- Se houver preferência por endpoint único, os endpoints `notes` e `advance` podem ser consolidados desde que:
  - a persistência da observação fique explícita no contrato
  - a transição de etapa seja atômica
  - o retorno traga a etapa seguinte já em `in_progress`
