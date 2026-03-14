# Prompt Para O Projeto Da API

Use este prompt no repositório da API para fechar o gap entre o detalhe de supplier do backoffice e a OpenAPI atual:

```text
Contexto

No frontend do backoffice da Registra AI, a tela de detalhe de supplier usa:

- GET /api/v1/supplier/companies/{supplierCompanyId}
- GET /api/v1/developments?supplierId={supplierId}
- GET /api/v1/developments/{developmentId}

Hoje o layout do detalhe de supplier mostra uma tabela de compradores por empreendimento com as colunas:

- Comprador
- Contato
- Unidade
- Etapa atual

Na OpenAPI atual, o schema DevelopmentProcessSummary exposto por GET /api/v1/developments/{developmentId} retorna apenas:

- id
- name
- status
- createdAt

Problema

O frontend precisa de um campo canônico para representar a etapa atual do processo vinculada ao comprador/unidade dentro do contexto do empreendimento. Hoje não existe no schema documentado um campo como:

- currentStepName
- currentStageName
- currentStage

Solicitação

1. Ajuste o contrato de GET /api/v1/developments/{developmentId} para que cada item de processes traga a etapa atual do processo.
2. Atualize a OpenAPI e os DTOs para documentar explicitamente esse campo.
3. Se o relacionamento comprador -> processo estiver disponível na API, mantenha processId no buyer e adicione no processo o nome legível da etapa atual.
4. Garanta compatibilidade com o backoffice usando x-portal=backoffice.

Contrato sugerido

Adicionar no schema DevelopmentProcessSummary:

- currentStageId: string | null
- currentStageName: string | null
- updatedAt: string(date-time) | null

Exemplo de resposta desejada

{
  "development": {
    "id": "7",
    "supplierId": "12",
    "name": "Reserva das Palmeiras"
  },
  "buyers": [
    {
      "id": "88",
      "name": "Maria Silva",
      "processId": "123",
      "unitLabel": "Apto 1203 - Torre A"
    }
  ],
  "processes": [
    {
      "id": "123",
      "name": "Maria Silva - Reserva das Palmeiras",
      "status": "in_progress",
      "currentStageId": "20",
      "currentStageName": "Validação documental",
      "createdAt": "2026-03-11T10:00:00.000Z",
      "updatedAt": "2026-03-11T12:00:00.000Z"
    }
  ]
}

Critérios de aceite

- OpenAPI publicada em /docs com o schema novo
- DTO/serializer retornando currentStageName no endpoint
- compatível com os portais existentes
- sem quebrar os consumers atuais
```
