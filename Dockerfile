FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY apps/bot/package.json ./apps/bot/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/database/prisma.config.ts ./packages/database/prisma.config.ts
COPY packages/database/prisma ./packages/database/prisma/
RUN pnpm install --frozen-lockfile --filter @duckorganization/questbot --filter @questbot/database

COPY . .
RUN pnpm turbo run build --filter=@duckorganization/questbot...

FROM node:24-alpine
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY apps/bot/package.json ./apps/bot/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/database/prisma.config.ts ./packages/database/prisma.config.ts
COPY packages/database/prisma ./packages/database/prisma/
RUN pnpm install --prod --frozen-lockfile --filter @duckorganization/questbot --filter @questbot/database

COPY --from=builder /app/apps/bot/dist ./apps/bot/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/src/generated ./packages/database/src/generated

CMD ["sh", "-c", "pnpm --filter @questbot/database db:push && pnpm --filter @duckorganization/questbot start"]
