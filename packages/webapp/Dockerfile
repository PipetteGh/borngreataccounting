# Stage 1: Build
FROM node:18.20-alpine AS builder

WORKDIR /app

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml lerna.json ./
COPY --chown=node:node packages/webapp ./packages/webapp
COPY --chown=node:node shared ./shared

RUN if [ ! -f "packages/webapp/dist/index.html" ]; then \
      npm install -g pnpm@9.0.5 && \
      pnpm install --no-frozen-lockfile && \
      pnpm run build:webapp; \
    else \
      echo "Using prebuilt packages/webapp/dist bundle"; \
    fi

# Stage 2: Nginx
FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="BorngreatAccounting Web" \
      org.opencontainers.image.description="BorngreatAccounting (BtAccounting) Web Frontend SPA" \
      org.opencontainers.image.vendor="Borngreat (Peter Borngreat-Mensah)" \
      org.opencontainers.image.licenses="AGPL-3.0" \
      org.opencontainers.image.source="https://github.com/PipetteGh/borngreataccounting"

COPY --chown=root:root ./packages/webapp/nginx/sites/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/packages/webapp/dist /usr/share/nginx/html

EXPOSE 80
