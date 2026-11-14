# ==============================================================================
# BorngreatAccounting — Backend API & Worker Container (docker/backend/Dockerfile)
# Multi-stage production build (Node 18 Alpine -> Non-root Node 18 Alpine)
# ==============================================================================
FROM node:18.20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.0.5 && \
    apk add --no-cache python3 build-base chromium

ENV PYTHON=/usr/bin/python3

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml lerna.json ./
COPY --chown=node:node packages/server/package.json ./packages/server/
COPY --chown=node:node shared ./shared

RUN pnpm install --no-frozen-lockfile

COPY --chown=node:node ./packages/server ./packages/server

RUN pnpm run build:server --skip-nx-cache

# Stage 2: Production runtime
FROM node:18.20-alpine AS production

LABEL org.opencontainers.image.title="BorngreatAccounting API & Worker" \
      org.opencontainers.image.description="BorngreatAccounting (BtAccounting) NestJS API, CLI & Queue Worker" \
      org.opencontainers.image.vendor="Borngreat (Peter Borngreat-Mensah)" \
      org.opencontainers.image.licenses="AGPL-3.0" \
      org.opencontainers.image.source="https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative"

WORKDIR /app

RUN npm install -g pnpm@9.0.5 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    apk add --no-cache python3 build-base bash netcat-openbsd

ENV PYTHON=/usr/bin/python3

COPY --chown=nodejs:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=nodejs:nodejs packages/server/package.json ./packages/server/
COPY --chown=nodejs:nodejs shared ./shared
COPY --chown=nodejs:nodejs .husky ./.husky

RUN pnpm add -D -w husky && \
    pnpm install --prod --no-frozen-lockfile && \
    pnpm remove -w husky && \
    apk del python3 build-base

COPY --from=builder --chown=nodejs:nodejs /app/packages/server/dist ./packages/server/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/src/i18n ./packages/server/dist/i18n
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/public ./packages/server/public
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/static ./packages/server/static
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/src/database ./packages/server/src/database
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared
COPY --chown=nodejs:nodejs ./docker/scripts/entrypoint.sh /app/entrypoint.sh
COPY --chown=nodejs:nodejs ./docker/healthchecks/api-healthcheck.sh /app/api-healthcheck.sh

RUN chmod +x /app/entrypoint.sh /app/api-healthcheck.sh

ENV NODE_ENV=production
ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV PORT=3000

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD /app/api-healthcheck.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "packages/server/dist/main.js"]
