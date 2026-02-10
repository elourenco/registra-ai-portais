# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder
ARG APP_PATH
ARG APP_PKG

WORKDIR /workspace

RUN corepack enable

COPY . .
RUN pnpm install
RUN pnpm --filter ${APP_PKG} build

FROM nginx:1.27-alpine AS runtime
ARG APP_PATH

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/${APP_PATH}/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
