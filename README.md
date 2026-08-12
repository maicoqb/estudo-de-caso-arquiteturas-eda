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
docker compose -f docker-compose.base.yaml up -d
```

Sobe PostgreSQL, RabbitMQ, Grafana, Tempo e PgAdmin.

## Acessos

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| RabbitMQ Management | http://localhost:15672 | guest / guest |
| Grafana | http://localhost:3000 | admin / admin |
| PgAdmin | http://localhost:5050 | admin@admin.com / admin |
| PostgreSQL | localhost:5432 | admin / admin (db: eda) |

> No PgAdmin, para conectar no PostgreSQL use o host `postgres` (nome do service no docker compose).
