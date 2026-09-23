# Cloud Run deployment artifact for @gieni/web
FROM node:22-alpine AS builder

WORKDIR /app

# Install monorepo dependencies
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN npm ci
RUN npm run build --workspace=@gieni/web

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web ./apps/web

USER nextjs

EXPOSE 8080

WORKDIR /app/apps/web
CMD ["npm", "run", "start", "--", "-p", "8080", "-H", "0.0.0.0"]
