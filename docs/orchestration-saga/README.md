# Orchestration Saga

> 📐 Veja a [arquitetura técnica do sistema](./architecture.md) utilizado para demonstrar este padrão.

Orchestration Saga é um padrão de coordenação distribuída onde um serviço central (o orquestrador) controla o fluxo da saga. Ele sabe quais passos executar, em qual ordem, e o que compensar quando algo falha.

Os workers são "burros" — recebem um comando, executam, e respondem com sucesso ou falha. Toda a lógica de decisão (próximo passo, compensação, retry) está centralizada no orquestrador.

## Princípios

- Um coordenador central define e controla o fluxo da saga
- Workers não sabem da existência uns dos outros
- Compensação centralizada: o orquestrador decide o que desfazer e em qual ordem
- O estado da saga é mantido pelo orquestrador (visibilidade total do progresso)
- Fluxo explícito — fácil de entender, debugar e alterar

## O que ele resolve bem

- Fluxos complexos com muitos passos e dependências
- Cenários onde a ordem pode mudar sem impactar os workers
- Visibilidade centralizada do estado de cada saga
- Lógica de compensação complexa (pular passos, compensação parcial)
- Fluxos com branching condicional (se X, faz Y; senão, faz Z)

## O que ele não resolve

- O orquestrador é um ponto único de falha (precisa de alta disponibilidade)
- Pode se tornar um gargalo se concentrar muita lógica
- Maior acoplamento ao orquestrador (se ele muda, impacta o fluxo inteiro)
- Mais complexo de implementar que fire-and-forget ou choreography

## Cenários de Uso

### Cenário Feliz

```mermaid
sequenceDiagram
    participant Cliente
    participant OrderAPI
    participant Broker
    participant Orchestrator
    participant Inventory
    participant Payment
    participant Shipping

    Cliente->>OrderAPI: POST /orders
    OrderAPI->>Broker: publica "order.created"
    OrderAPI-->>Cliente: 202 Accepted

    Broker->>Orchestrator: entrega "order.created"
    Orchestrator->>Broker: comando "reserve-inventory"

    Broker->>Inventory: entrega "reserve-inventory"
    Inventory->>Inventory: reserva estoque
    Inventory->>Broker: responde "inventory.reserved"

    Broker->>Orchestrator: entrega "inventory.reserved"
    Orchestrator->>Broker: comando "process-payment"

    Broker->>Payment: entrega "process-payment"
    Payment->>Payment: processa pagamento
    Payment->>Broker: responde "payment.processed"

    Broker->>Orchestrator: entrega "payment.processed"
    Orchestrator->>Broker: comando "schedule-shipping"

    Broker->>Shipping: entrega "schedule-shipping"
    Shipping->>Shipping: agenda envio
    Shipping->>Broker: responde "shipping.scheduled"

    Broker->>Orchestrator: entrega "shipping.scheduled"
    Orchestrator->>Orchestrator: saga completa ✅
```

### Cenário de Erro — Payment falha

O orquestrador recebe a falha e decide compensar na ordem inversa.

```mermaid
sequenceDiagram
    participant Orchestrator
    participant Broker
    participant Inventory
    participant Payment

    Orchestrator->>Broker: comando "process-payment"
    Broker->>Payment: entrega "process-payment"
    Payment->>Payment: ❌ falha (cartão recusado)
    Payment->>Broker: responde "payment.failed"

    Broker->>Orchestrator: entrega "payment.failed"
    Orchestrator->>Orchestrator: decide compensar
    Orchestrator->>Broker: comando "release-inventory"

    Broker->>Inventory: entrega "release-inventory"
    Inventory->>Inventory: ⬅️ libera estoque
    Inventory->>Broker: responde "inventory.released"

    Broker->>Orchestrator: entrega "inventory.released"
    Orchestrator->>Orchestrator: saga compensada ✅
```

### Cenário de Erro — Shipping falha (compensação em cascata)

O orquestrador desfaz todos os passos anteriores na ordem inversa.

```mermaid
sequenceDiagram
    participant Orchestrator
    participant Broker
    participant Inventory
    participant Payment
    participant Shipping

    Orchestrator->>Broker: comando "schedule-shipping"
    Broker->>Shipping: entrega "schedule-shipping"
    Shipping->>Shipping: ❌ falha (endereço inválido)
    Shipping->>Broker: responde "shipping.failed"

    Broker->>Orchestrator: entrega "shipping.failed"
    Orchestrator->>Orchestrator: decide compensar em cascata

    Orchestrator->>Broker: comando "refund-payment"
    Broker->>Payment: entrega "refund-payment"
    Payment->>Payment: ⬅️ estorna pagamento
    Payment->>Broker: responde "payment.refunded"

    Broker->>Orchestrator: entrega "payment.refunded"
    Orchestrator->>Broker: comando "release-inventory"
    Broker->>Inventory: entrega "release-inventory"
    Inventory->>Inventory: ⬅️ libera estoque
    Inventory->>Broker: responde "inventory.released"

    Broker->>Orchestrator: entrega "inventory.released"
    Orchestrator->>Orchestrator: saga compensada ✅
```

### Cenário de Falha na Compensação

Se um passo de compensação falhar, o orquestrador pode aplicar retries ou mover a saga para um estado de "falha não recuperável" que requer intervenção manual.

```mermaid
sequenceDiagram
    participant Orchestrator
    participant Broker
    participant Inventory
    participant DLQ

    Orchestrator->>Broker: comando "release-inventory"
    Broker->>Inventory: entrega "release-inventory"
    Inventory->>Inventory: ❌ falha na compensação
    Inventory->>Broker: responde "inventory.release-failed"

    Broker->>Orchestrator: entrega "inventory.release-failed"
    Orchestrator->>Orchestrator: marca saga como "falha não recuperável"

    Note over Orchestrator: Saga em estado terminal — requer intervenção manual
```
