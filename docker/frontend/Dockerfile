# ==============================================================================
# BorngreatAccounting — Frontend Web Container (docker/frontend/Dockerfile)
# Multi-stage production build (Node 18 Alpine -> Nginx Alpine)
# ==============================================================================
FROM node:18.20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.0.5 && \
    apk add --no-cache python3 build-base chromium

ENV PYTHON=/usr/bin/python3

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml lerna.json ./
COPY --chown=node:node packages/webapp/package.json ./packages/webapp/
COPY --chown=node:node shared ./shared

RUN pnpm install --no-frozen-lockfile

COPY --chown=node:node ./packages/webapp ./packages/webapp

RUN pnpm run build:webapp

# Stage 2: Production Nginx runtime
FROM nginx:1.27-alpine AS production

LABEL org.opencontainers.image.title="BorngreatAccounting Web" \
      org.opencontainers.image.description="BorngreatAccounting (BtAccounting) Web Frontend SPA" \
      org.opencontainers.image.vendor="Borngreat (Peter Borngreat-Mensah)" \
      org.opencontainers.image.licenses="AGPL-3.0" \
      org.opencontainers.image.source="https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative"

COPY --chown=root:root ./packages/webapp/nginx/sites/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/packages/webapp/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ >/dev/null 2>&1 || exit 1
