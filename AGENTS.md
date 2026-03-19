
# AGENTS.md

## Project

**Registra AI**

Plataforma SaaS para gestão e execução de processos de registro imobiliário,
permitindo que empresas operem grandes volumes de registros de forma estruturada,
auditável e escalável.

O sistema digitaliza toda a jornada de registro de imóveis, desde a abertura
do processo até a emissão da matrícula registrada, organizando documentos,
validações, solicitações e interações entre os participantes.

A plataforma funciona como uma **workflow engine operacional especializada
em registro imobiliário**.

---

# Product Vision

O objetivo da Registra AI é transformar um processo historicamente:

- burocrático
- manual
- fragmentado
- dependente de e-mails e documentos soltos

em um **sistema digital centralizado de operação de registros imobiliários**.

A plataforma permite que empresas operem **centenas ou milhares de processos
simultaneamente**, com:

- controle operacional
- rastreabilidade documental
- histórico completo de interações
- redução de erros
- maior velocidade de conclusão do registro

---

# Actors

A plataforma conecta três atores principais.

## Backoffice

Equipe operacional responsável por conduzir os processos.

Responsabilidades:

- analisar processos
- identificar pendências
- solicitar documentos ou dados
- validar respostas
- aprovar ou rejeitar envios
- controlar SLA operacional
- acompanhar exigências de cartório
- garantir avanço do processo até o registro final

O backoffice é o **operador da jornada**.

---

## Supplier

Clientes B2B da plataforma.

Exemplos:

- construtoras
- incorporadoras
- bancos
- loteadoras

Responsabilidades:

- cadastrar empreendimentos
- cadastrar unidades
- vincular compradores
- acompanhar carteira de processos

O supplier **origina a carteira de processos**.

---

## Comprador

Cliente final do imóvel.

Responsabilidades:

- preencher informações cadastrais
- enviar documentos
- responder solicitações
- corrigir inconsistências
- reenviar arquivos rejeitados
- acompanhar o status do próprio processo

O comprador utiliza a plataforma como **portal de pendências e respostas**.

---

# Operational Model

A plataforma funciona como um **sistema de trocas estruturadas entre backoffice
e comprador**.

O fluxo ocorre em formato de **ping‑pong operacional**.

### Backoffice envia

- solicitações
- pedidos de documentos
- correções
- exigências
- validações
- mensagens operacionais

### Comprador responde

- preenchimento de dados
- envio de documentos
- reenvio de arquivos
- complementação de informações
- confirmação de dados

Cada interação reduz incerteza e aproxima o processo de:

**registro concluído**.

---

# Core Architecture

A plataforma utiliza uma **Workflow Engine baseada em Template + Instance**.

Process Template
↓
Process Instance (por comprador)

Cada comprador gera automaticamente uma **instância do processo**.

O Supplier **não pode alterar o fluxo do processo**.

---

# Workflow Template

Existe um template padrão para todos os processos.

ProcessTemplate
│
├ Block
│ ├ Item
│ │ ├ Task
│ │ └ Required Documents

## Blocos

1. Certificado
2. Contrato
3. Registro

Exemplo:

Certificado
- Enviar RG
- Enviar CNH
- Enviar comprovante de endereço

Contrato
- Enviar escritura
- Assinar contrato

Registro
- Confirmar ITBI
- Enviar matrícula

---

# Process Instance

Quando um comprador é criado:

createProcessInstance(template_id, buyer_id)

O sistema gera automaticamente:

ProcessInstance
│
├ BlockInstance
│ ├ ItemInstance
│ │ ├ Submission
│ │ ├ Review
│ │ └ Rework
│
└ ActivityLog

---

# Workflow State Machine

Estados possíveis:

pending
awaiting_submission
submitted
under_review
approved
rejected
rework_requested
completed

Fluxo padrão:

pending
↓
awaiting_submission
↓
submitted
↓
under_review
↓
approved
↓
completed

Fluxo com erro:

under_review
↓
rejected
↓
rework_requested
↓
awaiting_submission

---

# Task Responsibility

Cada item possui responsável.

Possíveis responsáveis:

- comprador
- supplier
- backoffice

Exemplo:

Enviar RG → comprador
Enviar escritura → supplier
Emitir ITBI → backoffice

---

# Document Management

Tipos aceitos:

- PDF
- JPG
- JPEG
- PNG

Estrutura:

Document
id
item_id
version
file_url
uploaded_by
uploaded_at
status

Versionamento obrigatório.

---

# Backoffice Actions

O backoffice pode:

- visualizar documento
- baixar documento
- aprovar item
- reprovar item
- solicitar correção
- adicionar comentário

Quando reprovado:

status = rework_requested

O sistema deve:

1. criar nova tarefa
2. notificar responsável
3. permitir novo envio

---

# Block Progress Rules

Um bloco só conclui quando:

todos os itens obrigatórios = approved

Caso exista:

- pending
- rejected
- rework_requested

o bloco permanece aberto.

---

# Notifications

Eventos que geram notificação:

- nova tarefa criada
- documento enviado
- item aprovado
- item reprovado
- correção solicitada

Destinatários:

- comprador
- supplier
- backoffice

---

# Data Model

Entidades principais:

tenants
suppliers
empreendimentos
compradores

process_templates
process_template_blocks
process_template_items

process_instances
process_instance_blocks
process_instance_items

documents
document_versions

tasks
requests
activity_logs
notifications

---

# Navigation (Backoffice)

Menu principal:

Dashboard
Suppliers
Empreendimentos
Compradores
Processos
Solicitações
Documentos
Atividades
Financeiro
Configurações

---

# API Contract Validation (OpenAPI)

Sempre que uma feature frontend depender de API,
é obrigatório validar a existência do endpoint
na OpenAPI do projeto.

OpenAPI oficial:

http://localhost:3000/docs/

### Regra obrigatória

Antes de integrar com API:

1. Verificar se o endpoint existe
2. Validar:
   - path
   - method
   - request schema
   - response schema
   - status codes

### Integração com frontend

Contracts devem ser definidos em:

packages/shared/src/api

Payloads devem ser validados com **Zod**.

Requisições devem usar **TanStack Query**.

---

# API Gap Detection

Se a OpenAPI não possuir endpoint necessário:

1. Identificar o gap
2. Não criar mocks silenciosos
3. Gerar prompt para projeto de API

### Estrutura do prompt

API Feature Request

Contexto:
Descrever funcionalidade necessária.

Portal afetado:
customer | supplier | backoffice

Endpoint sugerido:
METHOD /v1/resource

Request schema

Response schema

Regras de negócio

Observações de integração

---

# Key Principles

1. O processo é definido por template
2. Cada comprador gera uma instância
3. Supplier não altera fluxo
4. Backoffice valida etapas
5. Itens podem ser reprovados e reenviados
6. Histórico deve ser auditável
7. O sistema deve suportar milhares de processos simultâneos

---

# Mental Model for AI

A plataforma **não é apenas um painel administrativo**.

Ela é uma **workflow engine de registro imobiliário**.

Modelo mental:

Supplier cria carteira
↓
Backoffice conduz processo
↓
Comprador responde pendências
↓
Backoffice valida ou devolve
↓
Ciclo repete até registro concluído

---

# Goal

Criar uma workflow engine escalável capaz de:

- gerenciar milhares de processos simultaneamente
- controlar tarefas e documentos
- registrar histórico completo
- reduzir atrasos operacionais
- garantir rastreabilidade
- levar cada processo até o registro final
