# Estudo de Caso: Arquiteturas EDA

Este projeto é um estudo de caso prático sobre arquiteturas orientadas a eventos (Event-Driven Architecture). O objetivo é implementar e demonstrar diferentes padrões de EDA — cada um com seus próprios serviços, broker e docker compose — para que seja possível subir, executar e observar o comportamento de cada modelo na prática.

## O que é EDA

Event-Driven Architecture (EDA) é um estilo arquitetural onde os componentes de um sistema se comunicam por meio de eventos. Em vez de chamadas diretas entre serviços, um produtor publica um evento em um broker (como RabbitMQ ou Kafka) e consumidores interessados reagem a esse evento de forma assíncrona e desacoplada. Isso permite escalabilidade, independência entre serviços e maior resiliência — mas também introduz desafios como consistência eventual, tratamento de falhas e observabilidade.

## Padrões Estudados

| Padrão | Documento | Status |
|--------|-----------|--------|
| Fire-and-Forget | [docs/fire-and-forget](./docs/fire-and-forget/) | 🚧 Em andamento |
| Saga Coreografado | Em breve | ⏳ Pendente |
| Saga Orquestrado | Em breve | ⏳ Pendente |

## Stack

- **Monorepo:** Nx
- **Linguagem:** TypeScript
- **Infraestrutura:** Docker Compose (um por padrão)

## Como Rodar

### Infra base

```bash
npm run base:up
```

Sobe RabbitMQ, Grafana e Tempo.

### Fire-and-Forget (dev local)

```bash
npm run base:up
npm run fire-and-forget:serve
```

### Fire-and-Forget (Docker)

```bash
npm run fire-and-forget:up
```

### Criar pedidos (todos os cenários)

```bash
npm run create-orders
```

## Acessos

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| RabbitMQ Management | http://localhost:15672 | guest / guest |
| Grafana (Traces) | http://localhost:3000 | admin / admin |
| Order API | http://localhost:3001 | — |
