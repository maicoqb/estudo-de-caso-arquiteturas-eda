# Choreography Saga

> 📐 Veja a [arquitetura técnica do sistema](./architecture.md) utilizado para demonstrar este padrão.

Choreography Saga é um padrão de coordenação distribuída onde cada serviço sabe o que fazer quando recebe um evento — incluindo como compensar quando algo dá errado.

Cada serviço escuta eventos de sucesso e de falha. Quando um passo falha, o próprio serviço anterior escuta o evento de falha e executa a compensação (rollback). Não existe um coordenador central — a "coreografia" emerge da comunicação entre os serviços.

## Princípios

- Cada serviço conhece seus eventos de entrada e saída (sucesso e falha)
- Compensação distribuída: cada serviço é responsável pelo seu próprio rollback
- Sem coordenador central — os serviços reagem a eventos de sucesso e de falha
- Consistência eventual com mecanismo de compensação automático
- O fluxo é implícito (não existe uma definição centralizada dos passos)

## O que ele resolve bem

- Fluxos de múltiplos passos com necessidade de rollback
- Cenários onde cada serviço pode compensar independentemente
- Sistemas onde adicionar/remover um passo não deve impactar um orquestrador central

## O que ele não resolve

- Fluxos complexos com muitos passos (a coreografia fica difícil de rastrear)
- Cenários onde a ordem dos passos muda frequentemente
- Visibilidade centralizada do estado da saga (cada serviço sabe só a sua parte)
- Ciclos ou dependências circulares entre eventos

## Cenários de Uso

### Cenário Feliz

```mermaid
sequenceDiagram
    participant Cliente
    participant OrderAPI
    participant Broker
    participant Inventory
    participant Payment
    participant Shipping

    Cliente->>OrderAPI: POST /orders
    OrderAPI->>Broker: publica "order.created"
    OrderAPI-->>Cliente: 202 Accepted

    Broker->>Inventory: entrega "order.created"
    Inventory->>Inventory: reserva estoque
    Inventory->>Broker: publica "inventory.reserved"

    Broker->>Payment: entrega "inventory.reserved"
    Payment->>Payment: processa pagamento
    Payment->>Broker: publica "payment.processed"

    Broker->>Shipping: entrega "payment.processed"
    Shipping->>Shipping: agenda envio
    Shipping->>Broker: publica "shipping.scheduled"
```

### Cenário de Erro — Payment falha

Pagamento falha e o Inventory recebe o evento de falha para liberar o estoque.

```mermaid
sequenceDiagram
    participant Cliente
    participant OrderAPI
    participant Broker
    participant Inventory
    participant Payment

    Cliente->>OrderAPI: POST /orders
    OrderAPI->>Broker: publica "order.created"
    OrderAPI-->>Cliente: 202 Accepted

    Broker->>Inventory: entrega "order.created"
    Inventory->>Inventory: reserva estoque
    Inventory->>Broker: publica "inventory.reserved"

    Broker->>Payment: entrega "inventory.reserved"
    Payment->>Payment: ❌ falha (cartão recusado)
    Payment->>Broker: publica "payment.failed"

    Broker->>Inventory: entrega "payment.failed"
    Inventory->>Inventory: ⬅️ libera estoque (compensação)
    Inventory->>Broker: publica "inventory.released"

    Note over Inventory: Estoque liberado automaticamente
```

### Cenário de Erro — Shipping falha (compensação em cascata)

Shipping falha após pagamento aprovado. Payment escuta a falha e faz refund, Inventory escuta o refund e libera o estoque.

```mermaid
sequenceDiagram
    participant Cliente
    participant OrderAPI
    participant Broker
    participant Inventory
    participant Payment
    participant Shipping

    Cliente->>OrderAPI: POST /orders
    OrderAPI->>Broker: publica "order.created"
    OrderAPI-->>Cliente: 202 Accepted

    Broker->>Inventory: entrega "order.created"
    Inventory->>Inventory: reserva estoque
    Inventory->>Broker: publica "inventory.reserved"

    Broker->>Payment: entrega "inventory.reserved"
    Payment->>Payment: processa pagamento
    Payment->>Broker: publica "payment.processed"

    Broker->>Shipping: entrega "payment.processed"
    Shipping->>Shipping: ❌ falha (endereço inválido)
    Shipping->>Broker: publica "shipping.failed"

    Broker->>Payment: entrega "shipping.failed"
    Payment->>Payment: ⬅️ refund (compensação)
    Payment->>Broker: publica "payment.refunded"

    Broker->>Inventory: entrega "payment.refunded"
    Inventory->>Inventory: ⬅️ libera estoque (compensação)
    Inventory->>Broker: publica "inventory.released"

    Note over Payment: Pagamento estornado automaticamente
    Note over Inventory: Estoque liberado automaticamente
```

### Cenário de Falha na Compensação

Se a compensação também falhar (ex: Inventory não consegue liberar o estoque), a mensagem vai para a DLQ. O sistema fica inconsistente e precisa de intervenção manual.

```mermaid
sequenceDiagram
    participant Broker
    participant Inventory
    participant Payment
    participant DLQ

    Payment->>Broker: publica "payment.failed"

    Broker->>Inventory: entrega "payment.failed"
    Inventory->>Inventory: tenta liberar estoque
    Inventory->>Inventory: ❌ falha na compensação
    Broker->>DLQ: move mensagem após falha

    Note over Inventory: Compensação falhou — estoque preso
    Note over DLQ: Requer intervenção manual
```
