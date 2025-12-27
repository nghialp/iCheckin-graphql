## Quick context

- This is a NestJS backend using GraphQL (Apollo) + Fastify and TypeORM (Postgres). Key modules: `User`, `Auth` (JWT + Passport strategies for Google/Facebook), `Friendship`, and `Checkin`.
- GraphQL schema is auto-generated at `src/schema.gql` by `GraphQLModule.forRoot({ autoSchemaFile: ... })` (see `src/app.module.ts`).

## How the app runs (developer workflows)

- Docker dev: `docker-compose -f docker-compose.dev.yml up --build` (see `README.md`).
- Makefile helpers: `make dev-up`, `make prod-up`, `make logs`, `make shell`, `make psql`, `make clean`.
- Local Node: set env vars (DB_*, JWT_SECRET) then `pnpm/start/npm run start:dev` to run with Nest's watch mode.
- Build: `npm run build` -> run production with `npm run start:prod`.
- Tests: unit with `npm test`, e2e with `npm run test:e2e` (config in `test/jest-e2e.json`).

## Key files & patterns to inspect when modifying behavior

- Application bootstrap: `src/main.ts` (uses Fastify adapter, listens on port 3000).
- Module wiring + DB + GraphQL config: `src/app.module.ts`.
- Entities: patterns use `*.entity.ts` and are discovered via `__dirname + '/**/*.entity{.ts,.js}'` for TypeORM.
- Resolvers/services: GraphQL resolvers live next to services and DTOs, e.g. `src/user/*`, `src/auth/*`, `src/checkin/*`, `src/friendships/*`.
- Auth: `src/auth/*` (JwtModule configured with `process.env.JWT_SECRET`, strategies in `src/auth/strategies`, GraphQL guard in `src/auth/guards/gql-auth.guard.ts`).

## Project-specific conventions and important details

- Language and messages: Error messages and comments are in Vietnamese — preserve or follow the project's language when adding user-facing strings.
- GraphQL-first: Types are derived from TypeScript decorators; edit resolvers/DTOs to change API surface. Schema file is generated to `src/schema.gql`.
- TypeORM: `synchronize: true` is enabled in `app.module.ts` — this is intended for development only. Avoid relying on it for production migrations.
- Refresh tokens: refresh tokens are hashed (bcrypt) and stored on the `User` entity (`user.refreshToken`). The auth flow verifies refresh tokens by jwt-verify + bcrypt.compare. See `src/auth/auth.service.ts` for exact logic.
- Passport strategies: `GoogleStrategy` and `FacebookStrategy` are wired into `AuthModule` — OAuth handlers create users if not present (see `handleOAuth`).

## Typical changes and where to make them

- Add a new entity: create `src/<feature>/<name>.entity.ts`, then update or rely on the existing TypeORM glob in `app.module.ts`.
- Add GraphQL API: add DTOs (inputs/responses) + resolver + service under the feature folder (follow existing `auth` and `user` layout).
- Change DB config: edit `src/app.module.ts` or prefer using env vars and the `@nestjs/config` module already included.

## Commands you'll likely run while coding

- Start dev (watch): npm run start:dev
- Build: npm run build
- Lint & format: npm run lint, npm run format
- Run tests: npm test; e2e: npm run test:e2e
- Docker dev: docker-compose -f docker-compose.dev.yml up --build or make dev-up

## Quick examples from the codebase (copyable intent)

- Where to find GraphQL config: `src/app.module.ts` lines configuring `GraphQLModule.forRoot<ApolloDriverConfig>`.
- How JWT is signed (example): `this.jwtService.sign({ sub: user.id }, { expiresIn: '1h' })` in `src/auth/auth.service.ts`.
- How refresh tokens are checked: `jwtService.verify(token)` then `bcrypt.compare(token, user.refreshToken)` (see `refreshTokenFlow`).

## Safety notes & small gotchas

- Do not assume `synchronize: true` for production. If changing database schema for prod, prefer migrations.
- Env variables are required at runtime: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, JWT_SECRET.
- GraphQL playground is enabled in dev via `playground: true` (remove/disable in production).

## Environment variables (.env)

- This project expects runtime configuration via a `.env` file (not committed). Create a `.env` at the repo root when running locally.
- Required variables (used in `src/app.module.ts` and `src/auth/*`):

	- DB_HOST (e.g. `postgres` when using docker-compose, or `localhost` for local DB)
	- DB_PORT (default: `5432`)
	- DB_USERNAME (example: `postgres`)
	- DB_PASSWORD (example: the one in `docker-compose.dev.yml` or your own secret)
	- DB_DATABASE (example: `icheckin`)
	- JWT_SECRET (used by JwtModule for signing tokens)

- Optional / OAuth variables (if using Google/Facebook OAuth strategies):
	- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
	- FACEBOOK_APP_ID, FACEBOOK_APP_SECRET

### Example `.env` (local/dev)

```
# Postgres (docker-compose.dev.yml uses these defaults)
DB_HOST=your_db_host_here
DB_PORT=your_db_port_here
DB_USERNAME=your_username_here
DB_PASSWORD=your_password_here
DB_DATABASE=your_database_name_here

# JWT secret used to sign access/refresh tokens
JWT_SECRET=your_jwt_secret_here

# Optional OAuth creds
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
FACEBOOK_APP_ID=your_fb_app_id
FACEBOOK_APP_SECRET=your_fb_app_secret
```

Note: The `docker-compose.dev.yml` service `app` is configured with `env_file: - .env`, so the same `.env` can be used when running containers in dev.

## If you need more context

- Start by reading `src/app.module.ts`, `src/main.ts`, and `src/auth/auth.service.ts` for the authentication flow. Then inspect `src/user/*` and `src/friendships/*` for typical resolver/service structure.

---
If anything is missing or you'd like me to include CI/ENV examples, tell me which commands or environment details you want added and I will update this file.
