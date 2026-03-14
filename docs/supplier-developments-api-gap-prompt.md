# Prompt Para O Projeto Da API

Use este prompt no repositório da API para fechar o gap entre o cadastro inicial de empreendimento no portal Supplier e a OpenAPI atual:

```text
Contexto

No frontend do portal Supplier da Registra AI, a tela de cadastro inicial de empreendimento precisa coletar apenas os dados essenciais para abrir a jornada operacional:

- Nome Razão Social
- Nome Fantasia
- Número CNPJ
- Nome do empreendimento
- Endereço do empreendimento
- Torres
- Unidades
- Contribuinte se em área maior mencionar (se individualizado não precisa mencionar)
- Tipo de empreendimento: URBANO | RURAL
- Modalidade do empreendimento: COMERCIAL | RESIDENCIAL | STUDIO

Hoje a OpenAPI de POST /api/v1/developments ainda exige no schema DevelopmentCreateInput campos de registro imobiliário e cartório no momento do cadastro inicial, como:

- incorporationRegistrationNumber
- incorporationRegistrationDate
- masterRegistrationNumber
- registryOfficeName
- registryOfficeNumber
- registryOfficeCity
- registryOfficeState

Além disso, o contrato atual não documenta campos canônicos para:

- tipo territorial do empreendimento (urbano/rural)
- modalidade com suporte a studio
- observação de contribuinte em área maior

Problema

O frontend precisa remover o bloco de registro imobiliário do cadastro inicial do Supplier sem quebrar persistência, mas o contrato atual ainda obriga esses campos.

Também existe divergência semântica entre o campo atual developmentType e a UX desejada:

- developmentType hoje mistura categorias antigas como residential, commercial, mixed e land_subdivision
- a nova UX precisa separar:
  - tipo do empreendimento: urban | rural
  - modalidade do empreendimento: commercial | residential | studio

Solicitação

1. Ajuste o contrato de POST /api/v1/developments para suportar um cadastro inicial enxuto no portal Supplier.
2. Torne opcionais no create inicial os campos de registro imobiliário e cartório.
3. Adicione campos explícitos no DTO e na OpenAPI para:
   - landProfile: "urban" | "rural"
   - developmentModality: "commercial" | "residential" | "studio"
   - largerAreaContributorNote: string | null
4. Preserve compatibilidade com o backoffice:
   - aceitar x-portal=supplier para o fluxo enxuto
   - manter possibilidade de payload mais completo no backoffice
5. Documente claramente na OpenAPI quais campos são obrigatórios por portal/contexto.

Contrato sugerido

Adicionar no schema DevelopmentCreateInput:

- landProfile: enum("urban","rural")
- developmentModality: enum("commercial","residential","studio")
- largerAreaContributorNote: string | null

Alterar obrigatoriedade no create do Supplier:

- obrigatórios:
  - name
  - legalName
  - tradeName
  - speCnpj
  - address
  - number
  - neighborhood
  - city
  - state
  - postalCode
  - totalTowers
  - totalUnits
  - landProfile
  - developmentModality
- opcionais no create inicial do Supplier:
  - incorporationRegistrationNumber
  - incorporationRegistrationDate
  - masterRegistrationNumber
  - registryOfficeName
  - registryOfficeNumber
  - registryOfficeCity
  - registryOfficeState
  - largerAreaContributorNote

Exemplo de payload desejado para x-portal=supplier

{
  "name": "Residencial Horizonte",
  "legalName": "Horizonte SPE LTDA",
  "tradeName": "Horizonte",
  "speCnpj": "12345678000101",
  "postalCode": "04538-132",
  "address": "Avenida Engenheiro Luís Carlos Berrini",
  "number": "1200",
  "complement": "Torre A",
  "neighborhood": "Cidade Monções",
  "city": "São Paulo",
  "state": "SP",
  "totalTowers": 2,
  "totalUnits": 144,
  "landProfile": "urban",
  "developmentModality": "studio",
  "largerAreaContributorNote": "Contribuinte vinculado à matrícula mãe 998877"
}

Critérios de aceite

- OpenAPI publicada em /docs com o schema novo
- POST /api/v1/developments aceitando cadastro inicial do Supplier sem exigir bloco de registro imobiliário
- suporte explícito a developmentModality=studio
- suporte explícito a landProfile=urban|rural
- compatível com os portais existentes via x-portal
- sem quebrar os consumers atuais do backoffice
```
