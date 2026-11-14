# Stage 1: Build
FROM node:18.20-alpine AS builder

WORKDIR /app

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml lerna.json ./
COPY --chown=node:node packages/server ./packages/server
COPY --chown=node:node shared ./shared

RUN if [ ! -f "packages/server/dist/main.js" ]; then \
      npm install -g pnpm@9.0.5 && \
      apk add --no-cache python3 build-base && \
      export PYTHON=/usr/bin/python3 && \
      pnpm install --no-frozen-lockfile && \
      pnpm run build:server --skip-nx-cache; \
    else \
      echo "Using prebuilt packages/server/dist and shared bundles"; \
    fi

# Stage 2: Production
FROM node:18.20-alpine AS production

LABEL org.opencontainers.image.title="BorngreatAccounting API & Worker" \
      org.opencontainers.image.description="BorngreatAccounting (BtAccounting) NestJS API, CLI & Queue Worker" \
      org.opencontainers.image.vendor="Borngreat (Peter Borngreat-Mensah)" \
      org.opencontainers.image.licenses="AGPL-3.0" \
      org.opencontainers.image.source="https://github.com/PipetteGh/borngreataccounting"

WORKDIR /app

RUN npm install -g pnpm@9.0.5 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    apk add --no-cache python3 build-base

ENV PYTHON=/usr/bin/python3

COPY --chown=nodejs:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=nodejs:nodejs packages/server/package.json ./packages/server/
COPY --chown=nodejs:nodejs shared ./shared

RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts && \
    pnpm rebuild bcrypt && \
    apk del python3 build-base

COPY --from=builder --chown=nodejs:nodejs /app/packages/server/dist ./packages/server/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/src/i18n ./packages/server/dist/i18n
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/public ./packages/server/public
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/static ./packages/server/static
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/src/database ./packages/server/src/database
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

ENV NODE_ENV=production
ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV PORT=3000

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/system_db', (r) => {process.exit(r.statusCode >= 200 && r.statusCode < 300 ? 0 : 1)}).on('error', () => process.exit(1))"

CMD [ "node", "packages/server/dist/main.js" ]
