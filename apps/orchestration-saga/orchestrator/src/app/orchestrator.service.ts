import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

type SagaState =
  | 'RESERVING_INVENTORY'
  | 'PROCESSING_PAYMENT'
  | 'RELEASING_INVENTORY'
  | 'COMPLETED'
  | 'FAILED';

interface Transition {
  nextState: SagaState;
  command?: string;
}

const SAGA_FLOW: Record<string, Transition> = {
  'order.created': {
    nextState: 'RESERVING_INVENTORY',
    command: 'reserve-inventory',
  },
  'inventory.reserved': {
    nextState: 'PROCESSING_PAYMENT',
    command: 'process-payment',
  },
  'payment.processed': { nextState: 'COMPLETED' },

  'inventory.reserve-failed': { nextState: 'FAILED' },
  'payment.failed': {
    nextState: 'RELEASING_INVENTORY',
    command: 'release-inventory',
  },
  'inventory.released': { nextState: 'FAILED' },
};

interface Saga {
  orderId: string;
  state: SagaState;
  data: any;
}

@Injectable()
export class OrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly sagas = new Map<string, Saga>();

  constructor(private readonly brokerService: BrokerService) {}

  async onModuleInit() {
    await this.brokerService.subscribe(
      'order.exchange',
      'orchestration-saga.order.created.queue',
      'order.created',
      (event) => this.handleEvent(event),
    );

    await this.brokerService.subscribe(
      'orchestration-saga.replies.exchange',
      'orchestration-saga.replies.queue',
      '#',
      (event) => this.handleEvent(event),
    );
  }

  private async handleEvent(event: any) {
    const { type } = event;
    const { orderId } = event.data;

    const transition = SAGA_FLOW[type];
    if (!transition) {
      this.logger.warn(`No transition defined for event: ${type}`);
      return;
    }

    if (type === 'order.created') {
      this.sagas.set(orderId, {
        orderId,
        state: 'RESERVING_INVENTORY',
        data: event.data,
      });
    }

    const saga = this.sagas.get(orderId);
    if (!saga) return;

    saga.state = transition.nextState;
    this.logger.log(`[${orderId}] ${type} → ${saga.state}`);

    if (transition.command) {
      await this.sendCommand(transition.command, saga.data);
    }

    if (saga.state === 'COMPLETED' || saga.state === 'FAILED') {
      this.sagas.delete(orderId);
    }
  }

  private async sendCommand(command: string, data: any) {
    await this.brokerService.publish(
      'orchestration-saga.commands.exchange',
      command,
      {
        specversion: '1.0',
        id: `cmd-${command}-${data.orderId}`,
        source: 'orchestration-saga-orchestrator',
        type: command,
        time: new Date().toISOString(),
        datacontenttype: 'application/json',
        data,
      },
    );
  }
}
