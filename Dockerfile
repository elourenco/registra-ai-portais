FROM node:22-alpine AS builder
ARG APP_PATH
ARG APP_PKG
ARG VITE_API_URL

ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/portal-customer/package.json apps/portal-customer/package.json
COPY apps/portal-supplier/package.json apps/portal-supplier/package.json
COPY apps/portal-backoffice/package.json apps/portal-backoffice/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN test -n "${APP_PATH}" && test -n "${APP_PKG}" && test -n "${VITE_API_URL}"
RUN pnpm --filter ${APP_PKG} build

FROM nginx:1.27-alpine AS runtime
ARG APP_PATH

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/${APP_PATH}/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
