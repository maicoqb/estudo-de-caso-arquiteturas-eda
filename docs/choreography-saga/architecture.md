# Arquitetura — Choreography Saga

## Visão Geral

O sistema simula um fluxo de pedido de compra com compensação automática distribuída. Quando um passo falha, os serviços anteriores escutam eventos de falha e desfazem suas operações em cascata. Não existe orquestrador — cada serviço sabe reagir a sucessos e falhas.

```mermaid
graph LR
    Client([Cliente]) -->|POST /orders| OrderAPI
    OrderAPI -->|order.created| RabbitMQ[(RabbitMQ)]

    RabbitMQ -->|order.created| Inventory
    Inventory -->|inventory.reserved| RabbitMQ
    Inventory -->|inventory.released| RabbitMQ

    RabbitMQ -->|inventory.reserved| Payment
    Payment -->|payment.processed| RabbitMQ
    Payment -->|payment.failed| RabbitMQ
    Payment -->|payment.refunded| RabbitMQ

    RabbitMQ -->|payment.processed| Shipping
    Shipping -->|shipping.scheduled| RabbitMQ
    Shipping -->|shipping.failed| RabbitMQ

    RabbitMQ -->|payment.failed| Inventory
    RabbitMQ -->|payment.refunded| Inventory
    RabbitMQ -->|shipping.failed| Payment

    RabbitMQ -.->|falhas após nack| DLQ[(DLQ)]
```

## Serviços

| Serviço | Responsabilidade | Publica | Consome |
|---------|-----------------|---------|---------|
| **Order API** | Recebe pedido via HTTP e publica evento | `order.created` | — |
| **Inventory** | Reserva/libera estoque | `inventory.reserved`, `inventory.released` | `order.created`, `payment.failed`, `payment.refunded` |
| **Payment** | Processa/estorna pagamento | `payment.processed`, `payment.failed`, `payment.refunded` | `inventory.reserved`, `shipping.failed` |
| **Shipping** | Agenda/cancela envio | `shipping.scheduled`, `shipping.failed` | `payment.processed` |

## Fluxo de Eventos

### Exchanges e Filas

| Exchange | Tipo | Routing Key | Fila destino |
|----------|------|-------------|--------------|
| `order.exchange` | topic | `order.created` | `choreography-saga.order.created.queue` |
| `choreography-saga.inventory.exchange` | topic | `inventory.reserved` | `choreography-saga.inventory.reserved.queue` |
| `choreography-saga.inventory.exchange` | topic | `inventory.released` | (observabilidade) |
| `choreography-saga.payment.exchange` | topic | `payment.processed` | `choreography-saga.payment.processed.queue` |
| `choreography-saga.payment.exchange` | topic | `payment.failed` | `choreography-saga.payment.failed.queue` |
| `choreography-saga.payment.exchange` | topic | `payment.refunded` | `choreography-saga.payment.refunded.queue` |
| `choreography-saga.shipping.exchange` | topic | `shipping.scheduled` | (observabilidade) |
| `choreography-saga.shipping.exchange` | topic | `shipping.failed` | `choreography-saga.shipping.failed.queue` |

### Compensação

**Payment falha:**
- Payment publica `payment.failed`
- Inventory escuta → libera estoque → publica `inventory.released`

**Shipping falha:**
- Shipping publica `shipping.failed`
- Payment escuta → faz refund → publica `payment.refunded`
- Inventory escuta → libera estoque → publica `inventory.released`

### Dead Letter Queue

Mesma mecânica do fire-and-forget: mensagens que falham no handler (erro técnico, não de negócio) vão para `<queue>.dlq` via `<queue>.dlx`.

## Estrutura do Projeto

```
apps/
  base/
    order-api/             ← API HTTP (compartilhada)
  choreography-saga/
    inventory-worker/      ← Consumer RabbitMQ (reserva + compensação)
    payment-worker/        ← Consumer RabbitMQ (pagamento + refund + evento de falha)
    shipping-worker/       ← Consumer RabbitMQ (envio + evento de falha)

docs/
  choreography-saga/
    README.md              ← Documento conceitual
    architecture.md        ← Este documento

docker-compose.choreography-saga.yaml
```
