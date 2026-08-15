FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx nx build order-api

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist/apps/base/order-api ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "main.js"]
