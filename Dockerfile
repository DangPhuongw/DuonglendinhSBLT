FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Build shared, client, and server
RUN npm run build --workspace=shared
RUN npm run build --workspace=client
RUN npm run build --workspace=server

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy root and server dependencies
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install --omit=dev

# Copy built artifacts
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/question-bank ./server/question-bank

EXPOSE 4000

CMD ["node", "server/dist/index.js"]
