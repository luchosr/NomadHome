FROM node:20.20.0-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Copy manifests first for better layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY packages/config/package.json  ./packages/config/
COPY packages/shared/package.json  ./packages/shared/
COPY packages/db/package.json      ./packages/db/
COPY packages/ui/package.json      ./packages/ui/
COPY apps/api/package.json         ./apps/api/
COPY apps/web/package.json         ./apps/web/

# Prisma schema must exist before pnpm install so the db postinstall can run
COPY packages/db/prisma ./packages/db/prisma

# HUSKY=0 prevents the prepare script from failing without a .git directory
RUN HUSKY=0 pnpm install --frozen-lockfile

# Copy source and build dependency packages + the API
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN pnpm --filter @nomadhome/shared build
RUN pnpm --filter @nomadhome/db exec prisma generate
RUN pnpm --filter @nomadhome/db build
RUN pnpm --filter @nomadhome/api build

# Create a lean production bundle for the API.
# prisma is now a production dependency of @nomadhome/db so the postinstall
# (prisma generate) runs correctly here without --ignore-scripts.
RUN pnpm deploy --filter=@nomadhome/api --prod /prod/api

# ---- Runtime image ----
FROM node:20.20.0-alpine AS runner
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /prod/api .
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

RUN chown -R app:app /app
USER app

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
