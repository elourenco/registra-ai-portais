# Supplier Developments OpenAPI Validation

Data da validação: 2026-03-13  
Fonte: `http://localhost:3000/docs/swagger-ui-init.js`

## Endpoints confirmados na OpenAPI

- `GET /api/v1/developments`
- `POST /api/v1/developments`
- `GET /api/v1/developments/{developmentId}`
- `PUT /api/v1/developments/{developmentId}`
- `DELETE /api/v1/developments/{developmentId}`
- `GET /api/v1/buyers`
- `POST /api/v1/buyers`
- `GET /api/v1/buyers/{buyerId}`

## Validação HTTP real no servidor local

Data da validação real: 2026-03-13

Sem token, a API respondeu `401 Token de acesso não informado.` para:

- `GET /api/v1/developments`
- `POST /api/v1/developments`
- `GET /api/v1/developments/1`
- `PUT /api/v1/developments/1`
- `DELETE /api/v1/developments/1`
- `GET /api/v1/buyers`
- `POST /api/v1/buyers`
- `GET /api/v1/buyers/1`

Isso confirma que as rotas existem no servidor e estão protegidas por autenticação.

## Cobertura atual no frontend do supplier

- `empreendimentos`
  - lista por supplier autenticado
  - abertura de detalhe por click na linha
  - cadastro e redirecionamento para o detalhe após salvar
- `detalhe do empreendimento`
  - tabs de `Processos`, `Compradores` e `Detalhes`
  - consumo do payload agregado retornado por `GET /api/v1/developments/{developmentId}`
- `compradores`
  - cadastro com persistência dos campos básicos e complementares da compra do imóvel

## Gaps confirmados na OpenAPI para a UX atual do supplier

- `listas por empreendimento`
  - a OpenAPI não documenta endpoints específicos paginados para:
    - `GET /api/v1/developments/{developmentId}/buyers`
    - `GET /api/v1/developments/{developmentId}/processes`

## Decisão aplicada no frontend

- A UI de detalhe já está pronta para update e delete
- As mutações de update e delete estão ligadas por padrão
- É possível desabilitar localmente com:
  - `VITE_SUPPLIER_DEVELOPMENT_MUTATIONS_ENABLED=false`
- O formulário de comprador já envia os dados complementares aceitos por `BuyerCreateInput`

## Próxima ativação esperada

Quando a API estiver pronta:

1. Validar com token real os fluxos de `PUT` e `DELETE /api/v1/developments/{developmentId}`
2. Validar com token real `POST /api/v1/buyers` com os campos complementares
3. Se necessário, ajustar os nomes canônicos aceitos por `acquisitionType`
