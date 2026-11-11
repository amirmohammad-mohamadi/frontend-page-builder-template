# Builds one app (APP=web or APP=admin) into a small standalone image.
#   docker build --build-arg APP=web -t web .
#   docker run -p 3000:3000 --env-file .env web
#
# `next build` writes to apps/<app>/.next (the Nx build target runs inside the
# app folder). With `output: "standalone"` the server lands at
# apps/<app>/.next/standalone/apps/<app>/server.js, next to a pruned
# node_modules; static chunks and the public folder are copied beside it.
ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY libs/assets/package.json libs/assets/
COPY libs/components/package.json libs/components/
COPY libs/dtos/package.json libs/dtos/
COPY libs/enums/package.json libs/enums/
COPY libs/models/package.json libs/models/
COPY libs/services/package.json libs/services/
COPY libs/utils/package.json libs/utils/
COPY tools/generators/package.json tools/generators/
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM ${NODE_IMAGE} AS build
ARG APP=web
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined here; pass them as --build-arg or mount a .env.
ENV NEXT_TELEMETRY_DISABLED=1 NX_DAEMON=false
RUN npx nx build ${APP} --configuration=production

FROM ${NODE_IMAGE} AS runner
ARG APP=web
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1 APP=${APP}
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app app
COPY --from=build --chown=app:app /repo/apps/${APP}/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=build --chown=app:app /repo/apps/${APP}/public ./apps/${APP}/public
USER app
EXPOSE 3000
CMD ["sh", "-c", "node apps/${APP}/server.js"]
