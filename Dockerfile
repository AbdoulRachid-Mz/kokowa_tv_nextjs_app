# ---- builder ----
FROM node:20-alpine AS builder
# utilities
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# copy package metadata first (cache npm install)
COPY package.json package-lock.json* ./
# If you use pnpm/yarn, adapte
RUN npm ci --production=false

# copy rest
COPY . .

# build (next build produit .next/)
RUN npm run build

# ---- runner ----
FROM node:20-alpine AS runner

# create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# copy only what's required to run
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# si tu utilises next.config.mjs, copy-le aussi
COPY --from=builder /app/next.config.mjs ./next.config.mjs

ENV NODE_ENV=production
ENV PORT=3000

# user non-root
USER appuser

EXPOSE 3000

# démarre en mode production (assure-toi d'avoir "start": "next start" dans package.json)
CMD ["npm", "start"]
