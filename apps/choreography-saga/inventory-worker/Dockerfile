FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx nx build choreography-saga-inventory-worker

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist/apps/choreography-saga/inventory-worker ./
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "main.js"]
