# The storefront: server-rendered on every request and holding a Reverb websocket per open
# tab, so it runs as a long-lived Node process rather than a function. See vite.config.ts.

# ---------------------------------------------------------------- build
FROM oven/bun:1-alpine AS build

WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

# VITE_* values are read at build time and end up inside the bundle the browser downloads,
# so they are build arguments rather than runtime environment. Changing one needs a rebuild.
ARG VITE_API_URL
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME
ENV VITE_API_URL=$VITE_API_URL \
    VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_REVERB_HOST=$VITE_REVERB_HOST \
    VITE_REVERB_PORT=$VITE_REVERB_PORT \
    VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

RUN bun run build

# ---------------------------------------------------------------- runtime
# Node, not Bun: nitro's node-server preset emits a Node server, and running it on the
# runtime it was built for is one less thing to debug at 3am.
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.output ./.output

# API_URL is read on the server for SSR loaders and is genuinely runtime: the same image can
# be pointed at staging or production without rebuilding.
ENV PORT=3000
EXPOSE 3000

USER node

CMD ["node", ".output/server/index.mjs"]
