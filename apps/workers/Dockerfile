# Cloud Run deployment artifact for @gieni/workers
FROM node:22-alpine AS builder

WORKDIR /app

# Install monorepo dependencies
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/workers/ ./apps/workers/

RUN npm ci
RUN npm run build --workspace=@gieni/workers

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 workeruser

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/workers ./apps/workers

USER workeruser

EXPOSE 8080

WORKDIR /app/apps/workers
CMD ["node", "dist/index.js"]
