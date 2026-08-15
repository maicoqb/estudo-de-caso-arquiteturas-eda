# Estudo de Caso: Arquiteturas EDA

Este projeto é um estudo de caso prático sobre arquiteturas orientadas a eventos (Event-Driven Architecture). O objetivo é implementar e demonstrar diferentes padrões de EDA e observar o comportamento de cada modelo na prática.

## O que é EDA

Event-Driven Architecture (EDA) é um estilo arquitetural onde os componentes de um sistema se comunicam por meio de eventos. Em vez de chamadas diretas entre serviços, um produtor publica um evento em um broker (como RabbitMQ ou Kafka) e consumidores interessados reagem a esse evento de forma assíncrona e desacoplada. Isso permite escalabilidade, independência entre serviços e maior resiliência — mas também introduz desafios como consistência eventual, tratamento de falhas e observabilidade.

## Padrões Estudados

| Padrão | Documento |
|--------|-----------|
| Fire-and-Forget | [docs/fire-and-forget](./docs/fire-and-forget/) |
| Choreography Saga | [docs/choreography-saga](./docs/choreography-saga/) |
| Orchestration Saga | [docs/orchestration-saga](./docs/orchestration-saga/) |

## Stack

- **Monorepo:** Nx
- **Linguagem:** TypeScript
- **Broker:** RabbitMQ
- **Tracing:** OpenTelemetry → Grafana Tempo
- **Infraestrutura:** Docker Compose

## Como Rodar

### Infra base (RabbitMQ, Grafana, Tempo)

```bash
npm run base:up
```

### Fire-and-Forget

```bash
npm run fire-and-forget:serve        # dev local
npm run fire-and-forget:up           # docker
npm run fire-and-forget:create-orders
```

### Choreography Saga

```bash
npm run choreography-saga:serve        # dev local
npm run choreography-saga:up           # docker
npm run choreography-saga:create-orders
```

### Orchestration Saga

```bash
npm run orchestration-saga:serve        # dev local
npm run orchestration-saga:up           # docker
npm run orchestration-saga:create-orders
```

## Acessos

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| RabbitMQ Management | http://localhost:15672 | guest / guest |
| Grafana (Traces) | http://localhost:3000 | admin / admin |
| Order API | http://localhost:3001 | — |
