# Registra AI Portals

Monorepo frontend com 3 portais:
- `portal-customer`
- `portal-supplier`
- `portal-backoffice`

Stack padrão:
- React + Vite + TypeScript
- React Router
- TanStack Query
- Zod
- Motion
- shadcn/ui (via `packages/ui`)
- Referência UI: https://ui.shadcn.com/docs

## Estrutura

```text
registra-ai-portais/
├── apps/
│   ├── portal-customer/
│   ├── portal-supplier/
│   └── portal-backoffice/
├── packages/
│   ├── ui/                 # componentes compartilhados (estilo shadcn/ui)
│   └── shared/             # helpers e types compartilhados de UI/auth
├── docker/
│   └── nginx/default.conf
├── .codex/
│   ├── config.toml         # MCP local do Codex (shadcn)
│   └── skills/
│       └── registra-portals-modular/
├── AGENTS.md
├── Dockerfile
├── docker-compose.yml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Padrão modular por app

Cada app segue:

```text
src/
├── app/                    # providers, layouts, router
├── features/               # regras e telas por domínio (auth, dashboard)
├── widgets/                # blocos compostos de UI da página
└── shared/                 # config local, constantes, estilos
```

## Telas mock implementadas

Em cada portal:
- Tela de Login com validação Zod + React Hook Form
- Fluxo de autenticação mock com `useMutation` (TanStack Query)
- Dashboard mock protegido por rota autenticada
- Logout e redirecionamento

## Supplier: empreendimentos

O `portal-supplier` já possui a feature de `empreendimentos` com:
- lista de empreendimentos
- cadastro de empreendimento
- detalhe com tabs de `Processos`, `Compradores` e `Detalhes`
- cadastro de comprador no contexto do empreendimento

Gaps atuais de API estão documentados em:
- `docs/supplier-developments-openapi-validation.md`

Feature flags preparadas para próxima etapa:

```bash
VITE_SUPPLIER_DEVELOPMENT_MUTATIONS_ENABLED=false
VITE_SUPPLIER_DEVELOPMENT_UPDATE_ENDPOINT=/api/v1/developments/{developmentId}
VITE_SUPPLIER_DEVELOPMENT_DELETE_ENDPOINT=/api/v1/developments/{developmentId}
VITE_SUPPLIER_BUYER_PURCHASE_DATA_ENABLED=false
```

### Login mock
Use qualquer e-mail válido e senha com mínimo de 6 caracteres.

## Executar localmente

Pré-requisitos:
- Node.js `>=20.19.0` ou `>=22.12.0`
- pnpm 10+

Comandos:

```bash
corepack enable
pnpm install
pnpm dev
```

Portas de desenvolvimento:
- Customer: [http://localhost:5173](http://localhost:5173)
- Supplier: [http://localhost:5174](http://localhost:5174)
- Backoffice: [http://localhost:5175](http://localhost:5175)

Comandos úteis:

```bash
pnpm dev:customer
pnpm dev:supplier
pnpm dev:backoffice
pnpm build:customer
pnpm build:supplier
pnpm build:backoffice
pnpm verify:deploy
pnpm lint
pnpm format
pnpm typecheck
pnpm build
```

## Deploy em servidor com Docker

Este projeto sobe três frontends estáticos separados, cada um em um container
nginx próprio:

- `portal-customer` em `127.0.0.1:8081`
- `portal-supplier` em `127.0.0.1:8082`
- `portal-backoffice` em `127.0.0.1:8083`

O acesso público deve ser feito por reverse proxy com três subdomínios/domínios
separados, por exemplo:

- `https://customer.seudominio.com` -> `127.0.0.1:8081`
- `https://supplier.seudominio.com` -> `127.0.0.1:8082`
- `https://backoffice.seudominio.com` -> `127.0.0.1:8083`
- API: `https://api.seudominio.com`

### 1. Preparar DNS

Crie registros `A` ou `CNAME` apontando os três subdomínios para o servidor:

```text
customer.seudominio.com   A   <IP_DO_SERVIDOR>
supplier.seudominio.com   A   <IP_DO_SERVIDOR>
backoffice.seudominio.com A   <IP_DO_SERVIDOR>
```

A API pode estar no mesmo servidor ou em outro host, mas precisa estar acessível
pelo navegador do usuário final.

### 2. Preparar o servidor

Exemplo em Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Depois de adicionar o usuário ao grupo `docker`, encerre a sessão SSH e conecte
novamente antes de rodar `docker`.

Valide:

```bash
docker version
docker compose version
nginx -v
```

### 3. Clonar o projeto

```bash
git clone <URL_DO_REPOSITORIO> registra-ai-portais
cd registra-ai-portais
```

### 4. Configurar ambiente de build

Crie um `.env` na raiz do projeto:

```bash
cat > .env <<'EOF'
VITE_API_URL=https://api.seudominio.com
EOF
```

`VITE_API_URL` é lido em build-time pelo Vite. Se a URL da API mudar, é
necessário rebuildar as imagens.

### 5. Validar antes de subir

O runtime de produção precisa apenas de Docker e nginx. Node/pnpm só são
necessários se você quiser rodar validações fora do Docker no próprio servidor.

Para validar no servidor, instale Node compatível (`>=20.19.0` ou `>=22.12.0`)
e execute:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm verify:deploy
```

Opcionalmente rode lint:

```bash
pnpm lint
```

Se essas validações já rodam no CI ou na sua máquina antes do deploy, o servidor
pode seguir direto para o build Docker.

### 6. Buildar e subir os containers

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Valide localmente no servidor:

```bash
curl -I http://127.0.0.1:8081
curl -I http://127.0.0.1:8082
curl -I http://127.0.0.1:8083
```

Os containers usam `restart: unless-stopped` e healthcheck HTTP na raiz do
nginx.

### 7. Configurar reverse proxy nginx

Crie um arquivo para cada portal em `/etc/nginx/sites-available`.

Customer:

```nginx
server {
  listen 80;
  server_name customer.seudominio.com;

  location / {
    proxy_pass http://127.0.0.1:8081;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Supplier:

```nginx
server {
  listen 80;
  server_name supplier.seudominio.com;

  location / {
    proxy_pass http://127.0.0.1:8082;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Backoffice:

```nginx
server {
  listen 80;
  server_name backoffice.seudominio.com;

  location / {
    proxy_pass http://127.0.0.1:8083;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Ative os sites:

```bash
sudo ln -s /etc/nginx/sites-available/customer.seudominio.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/supplier.seudominio.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/backoffice.seudominio.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Se o reverse proxy estiver em outro servidor, altere as portas no
`docker-compose.yml` para expor em `0.0.0.0` ou coloque os containers em uma
rede acessível pelo proxy. O padrão atual usa `127.0.0.1` para não expor
`8081/8082/8083` diretamente na internet.

### 8. Habilitar HTTPS

Exemplo com Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx \
  -d customer.seudominio.com \
  -d supplier.seudominio.com \
  -d backoffice.seudominio.com
```

Valide renovação automática:

```bash
sudo certbot renew --dry-run
```

### 9. Atualizar deploy

Para publicar uma nova versão:

```bash
cd registra-ai-portais
git pull
docker compose up -d --build
docker compose ps
```

Se mudar `VITE_API_URL`, atualize `.env` e rode novamente:

```bash
docker compose up -d --build
```

### 10. Operação básica

Logs:

```bash
docker compose logs -f portal-customer
docker compose logs -f portal-supplier
docker compose logs -f portal-backoffice
```

Restart:

```bash
docker compose restart portal-customer
docker compose restart portal-supplier
docker compose restart portal-backoffice
```

Parar tudo:

```bash
docker compose down
```

Remover imagens antigas:

```bash
docker image prune -f
```

### Observações de produção

- O compose expõe os portais somente em `127.0.0.1`.
- O TLS deve ficar no nginx externo do servidor.
- O bundle gerado contém a URL de API definida por `VITE_API_URL`.
- Assets versionados em `/assets` são cacheados como imutáveis pelo nginx do container.
- Evite apontar `VITE_API_URL` para `localhost`, porque o browser do usuário resolveria `localhost` na máquina dele.

## Qualidade de código (BiomeJS)

Comandos principais:

```bash
pnpm lint              # biome lint .
pnpm format            # biome format . --write
pnpm biome:check       # valida lint + format sem escrever
pnpm biome:write       # aplica correções seguras
```

## Agents e Skills (OpenAI Codex)

### AGENTS.md do projeto
`AGENTS.md` define:
- regras de arquitetura modular
- regras de implementação da stack
- checklist de qualidade
- diretrizes de extração para `packages/*`

### Skill local recomendada
Skill criada: `registra-portals-modular` em `.agents/skills/registra-portals-modular/`.

Quando usar:
- criar/ajustar features nos 3 portais
- extrair componentes compartilhados
- ajustar roteamento/provedores
- manter Docker/README coerentes com estrutura
- implementar UI com base no shadcn/ui docs e exemplos oficiais

### MCP local do Codex
Este repositório inclui `.codex/config.toml` com servidor MCP do shadcn:

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["-y", "shadcn@latest", "mcp"]
```

Para validar no seu ambiente:

```bash
codex mcp list
```

## Referência técnica usada (Context7)
A implementação foi alinhada com documentação oficial consultada via Context7 para:
- Vite (`/vitejs/vite`)
- React Router (`/remix-run/react-router`)
- TanStack Query (`/tanstack/query`)
- shadcn/ui (`https://ui.shadcn.com/docs` e `https://ui.shadcn.com/docs/mcp`)
