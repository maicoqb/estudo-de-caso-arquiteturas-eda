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

    RabbitMQ -.->|falhas após retry| DLQ[(DLQ)]

    OrderAPI --- PostgreSQL[(PostgreSQL)]
    Inventory --- PostgreSQL
    Payment --- PostgreSQL
```

## Serviços

| Serviço | Responsabilidade | Publica | Consome |
|---------|-----------------|---------|---------|
| **Order API** | Recebe pedido via HTTP, persiste e publica evento | `order.created` | — |
| **Inventory** | Reserva estoque do produto | `inventory.reserved` | `order.created` |
| **Payment** | Processa pagamento do pedido | `payment.processed` | `inventory.reserved` |
| **Notification** | Envia notificação ao cliente (e-mail/push) | — | `payment.processed` |

## Fluxo de Eventos

### Exchanges e Filas

| Exchange | Tipo | Routing Key | Fila destino |
|----------|------|-------------|--------------|
| `order.events` | topic | `order.created` | `order.created.queue` |
| `inventory.events` | topic | `inventory.reserved` | `inventory.reserved.queue` |
| `payment.events` | topic | `payment.processed` | `payment.processed.queue` |

### Dead Letter Queue

Cada fila é configurada com:
- `x-dead-letter-exchange`: aponta para a DLQ exchange
- Retry máximo via política do RabbitMQ (ex: 3 tentativas)
- Mensagens que excedem o retry são movidas para a respectiva DLQ

## Estrutura do Projeto

```
apps/
  base/
    order-api/             ← API HTTP (compartilhada entre padrões)
  fire-and-forget/
    inventory-worker/      ← Consumer RabbitMQ
    payment-worker/        ← Consumer RabbitMQ
    notification-worker/   ← Consumer RabbitMQ

docs/
  fire-and-forget/
    README.md              ← Documento conceitual (EDA Fire-and-Forget)
    architecture.md        ← Este documento

docker-compose.base.yaml
docker-compose.fire-and-forget.yaml
```
