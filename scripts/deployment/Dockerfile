FROM oven/bun:1.3.14-alpine AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
ARG APP
ARG PUBLIC_COMMIT_HASH
ENV PUBLIC_COMMIT_HASH=$PUBLIC_COMMIT_HASH
RUN case "$APP" in web|auth|dashboard) bun run --cwd "apps/$APP" build ;; server) true ;; *) exit 1 ;; esac
FROM oven/bun:1.3.14-alpine
WORKDIR /app
RUN apk add --no-cache postgresql-client openssl
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build /app /app
ARG APP
ENV KSI_APP=$APP
USER bun
EXPOSE 3000
CMD ["sh", "scripts/deployment/start.sh"]
