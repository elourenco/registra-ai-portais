# Prompt Para O Projeto Da API

Use este prompt no repositório da API para fechar o gap entre o onboarding do portal Customer e o contrato necessário para `GET /api/v1/buyers/process`:

```text
Contexto

No frontend do portal Customer da Registra AI, após o login do comprador a aplicação consulta:

- GET /api/v1/buyers/process

Essa resposta alimenta a jornada de onboarding do comprador mantendo o layout atual, com as etapas:

- Confirmação do empreendimento
- Dados pessoais
- Estado civil
- Dados do cônjuge quando aplicável
- Checklist de documentos
- Revisão final
- Tracker do processo

Problema

Hoje o frontend precisa de campos canônicos para preencher essa jornada sem depender de inferências ou fallback local. Neste ambiente, a OpenAPI local não estava acessível em `http://localhost:3000/docs.json`, então o contrato não pôde ser validado diretamente.

Solicitação

Ajustar o contrato de `GET /api/v1/buyers/process` para documentar explicitamente os dados mínimos necessários para a UX atual do portal Customer.

Campos necessários

1. Identificação do processo
- processId: string
- status: "pending" | "awaiting_submission" | "submitted" | "under_review" | "approved" | "rejected" | "rework_requested" | "completed"
- currentStageId: string | null
- currentStageName: string | null
- submittedAt: string(date-time) | null
- updatedAt: string(date-time) | null

2. Empreendimento / unidade
- development.id: string
- development.name: string
- development.city: string | null
- unit.id: string | null
- unit.label: string | null

3. Comprador
- buyer.id: string
- buyer.identifierType: "cpf" | "cnpj"
- buyer.name: string
- buyer.documentNumber: string
- buyer.email: string | null
- buyer.phone: string | null
- buyer.birthDate: string(date) | null
- buyer.nationality: string | null
- buyer.profession: string | null
- buyer.maritalStatus: "single" | "married" | "stable_union" | null

4. Cônjuge quando aplicável
- spouse.id: string
- spouse.name: string
- spouse.documentNumber: string
- spouse.email: string | null
- spouse.phone: string | null
- spouse.birthDate: string(date) | null

5. Checklist de documentos
- documents[].id: string
- documents[].title: string
- documents[].owner: "buyer" | "spouse" | "backoffice"
- documents[].status: "pending" | "uploaded" | "approved" | "rejected"
- documents[].fileName: string | null
- documents[].fileType: string | null
- documents[].fileSizeKb: number | null
- documents[].fileUrl: string | null
- documents[].rejectionReason: string | null

6. Timeline operacional
- blocks[] ou stages[] com:
  - id: string
  - title: string
  - status: "pending" | "in_progress" | "completed"
  - description: string | null

Contrato sugerido

{
  "processId": "proc_123",
  "status": "under_review",
  "currentStageId": "contract_review",
  "currentStageName": "Análise contratual",
  "submittedAt": "2026-03-30T13:00:00.000Z",
  "updatedAt": "2026-03-30T13:20:00.000Z",
  "development": {
    "id": "dev_1",
    "name": "Residencial Aurora",
    "city": "São Paulo, SP"
  },
  "unit": {
    "id": "unit_22",
    "label": "Torre B · Apto 1203"
  },
  "buyer": {
    "id": "buyer_88",
    "identifierType": "cpf",
    "name": "Marina Duarte",
    "documentNumber": "12345678901",
    "email": "marina@exemplo.com",
    "phone": "11999999999",
    "birthDate": "1991-05-10",
    "nationality": "Brasileira",
    "profession": "Arquiteta",
    "maritalStatus": "married"
  },
  "spouse": {
    "id": "spouse_1",
    "name": "Carlos Duarte",
    "documentNumber": "10987654321",
    "email": "carlos@exemplo.com",
    "phone": "11988888888",
    "birthDate": "1990-02-03"
  },
  "documents": [
    {
      "id": "buyer-id",
      "title": "RG ou CNH",
      "owner": "buyer",
      "status": "approved",
      "fileName": "rg-marina.pdf",
      "fileType": "application/pdf",
      "fileSizeKb": 248,
      "fileUrl": "https://...",
      "rejectionReason": null
    }
  ],
  "stages": [
    {
      "id": "certificate",
      "title": "Certificado",
      "status": "completed",
      "description": "Documentos iniciais validados."
    },
    {
      "id": "contract",
      "title": "Contrato",
      "status": "in_progress",
      "description": "Análise contratual."
    },
    {
      "id": "registry",
      "title": "Registro",
      "status": "pending",
      "description": "Aguardando etapas anteriores."
    }
  ]
}

Critérios de aceite

- OpenAPI publicada em `/docs` com `GET /api/v1/buyers/process`
- DTO/serializer retornando todos os campos acima de forma canônica
- compatível com autenticação do portal customer
- sem exigir inferência no frontend para casamento, unidade, checklist documental ou timeline
```
