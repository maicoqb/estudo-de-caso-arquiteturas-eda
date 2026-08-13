import { DynamicModule, Module } from '@nestjs/common';
import { BrokerService } from './broker.service';

interface BrokerModuleOptions {
  url: string;
}

@Module({})
export class BrokerModule {
  static forRoot(options: BrokerModuleOptions): DynamicModule {
    return {
      module: BrokerModule,
      global: true,
      providers: [
        {
          provide: BrokerService,
          useFactory: async () => {
            const broker = new BrokerService(options.url);
            await broker.connect();
            return broker;
          },
        },
      ],
      exports: [BrokerService],
    };
  }
}
