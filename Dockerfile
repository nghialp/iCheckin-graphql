# Dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# copy source and build
COPY . .
RUN pnpm build

# run tests during build; if tests fail the build fails here
RUN pnpm test


FROM node:24-alpine AS runner
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod && pnpm approve-builds

# copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy ormconfig.json for migration
COPY --from=builder /app/ormconfig.json ./

EXPOSE 3000

# Run migration before starting the app
RUN npm run migration:run

CMD ["pnpm", "start:prod"]
