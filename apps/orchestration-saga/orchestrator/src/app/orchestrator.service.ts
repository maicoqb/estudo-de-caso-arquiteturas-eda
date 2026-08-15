import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { BrokerService } from '@libs/broker';

type SagaState =
  | 'RESERVING_INVENTORY'
  | 'COMPLETED'
  | 'FAILED';

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
    const type = event.type;
    const data = event.data;
    const orderId = data.orderId;

    switch (type) {
      case 'order.created':
        await this.startSaga(orderId, data);
        break;
      case 'inventory.reserved':
        await this.onInventoryReserved(orderId);
        break;
      case 'inventory.reserve-failed':
        await this.onInventoryReserveFailed(orderId);
        break;
      default:
        this.logger.warn(`Unknown event type: ${type}`);
    }
  }

  private async startSaga(orderId: string, data: any) {
    this.logger.log(`[${orderId}] Saga started → reserving inventory`);
    this.sagas.set(orderId, { orderId, state: 'RESERVING_INVENTORY', data });
    await this.sendCommand('reserve-inventory', data);
  }

  private async onInventoryReserved(orderId: string) {
    const saga = this.sagas.get(orderId);
    if (!saga) return;

    this.logger.log(`[${orderId}] Inventory reserved → saga completed ✅`);
    saga.state = 'COMPLETED';
    this.sagas.delete(orderId);

    // TODO: próximo passo será process-payment
  }

  private async onInventoryReserveFailed(orderId: string) {
    const saga = this.sagas.get(orderId);
    if (!saga) return;

    this.logger.log(`[${orderId}] Inventory reserve failed → saga failed ❌`);
    saga.state = 'FAILED';
    this.sagas.delete(orderId);
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
