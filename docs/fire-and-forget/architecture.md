# Arquitetura — Fire-and-Forget

## Visão Geral

O sistema simula um fluxo de pedido de compra onde cada etapa é um serviço independente que se comunica exclusivamente por eventos via RabbitMQ. Nenhum serviço chama outro diretamente — toda comunicação é assíncrona e unidirecional.

```mermaid
graph LR
    Client([Cliente]) -->|POST /orders| OrderAPI
    OrderAPI -->|order.created| RabbitMQ[(RabbitMQ)]
    RabbitMQ -->|order.created| Inventory
    Inventory -->|inventory.reserved| RabbitMQ
    RabbitMQ -->|inventory.reserved| Payment
    Payment -->|payment.processed| RabbitMQ
    RabbitMQ -->|payment.processed| Notification

    RabbitMQ -.->|falhas após nack| DLQ[(DLQ)]
```

## Serviços

| Serviço | Responsabilidade | Publica | Consome |
|---------|-----------------|---------|---------|
| **Order API** | Recebe pedido via HTTP e publica evento | `order.created` | — |
| **Inventory** | Reserva estoque do produto | `inventory.reserved` | `order.created` |
| **Payment** | Processa pagamento do pedido | `payment.processed` | `inventory.reserved` |
| **Notification** | Envia notificação ao cliente (e-mail/push) | — | `payment.processed` |

## Fluxo de Eventos

### Exchanges e Filas

| Exchange | Tipo | Routing Key | Fila destino |
|----------|------|-------------|--------------|
| `order.exchange` | topic | `order.created` | `fire-and-forget.order.created.queue` |
| `fire-and-forget.inventory.exchange` | topic | `inventory.reserved` | `fire-and-forget.inventory.reserved.queue` |
| `fire-and-forget.payment.exchange` | topic | `payment.processed` | `fire-and-forget.payment.processed.queue` |

### Dead Letter Queue

Cada fila é configurada automaticamente com:
- Uma DLX exchange (`<queue>.dlx`) do tipo fanout
- Uma DLQ fila (`<queue>.dlq`) bindada na DLX
- Quando o handler falha e faz `nack`, a mensagem é redirecionada para a DLQ

## Observabilidade

- **RabbitMQ Management** (http://localhost:15672) — estado das filas, mensagens na DLQ, consumers conectados
- **Grafana + Tempo** (http://localhost:3000) — tracing distribuído mostrando o fluxo do pedido entre serviços

## Estrutura do Projeto

```
apps/
  base/
    order-api/             ← API HTTP (compartilhada entre padrões)
  fire-and-forget/
    inventory-worker/      ← Consumer RabbitMQ
    payment-worker/        ← Consumer RabbitMQ
    notification-worker/   ← Consumer RabbitMQ

libs/
  broker/                  ← BrokerModule/BrokerService (conexão, publish, subscribe, DLQ)
  tracing/                 ← Setup OpenTelemetry (initTracing)

scripts/
  create-order.sh                    ← Cenário feliz
  create-order-inventory-error.sh    ← Erro no Inventory
  create-order-payment-error.sh      ← Erro no Payment
  create-order-notification-error.sh ← Erro no Notification
  create-order-all.sh                ← Executa todos os cenários

docs/
  fire-and-forget/
    README.md              ← Documento conceitual (EDA Fire-and-Forget)
    architecture.md        ← Este documento

docker-compose.base.yaml
docker-compose.fire-and-forget.yaml
```
