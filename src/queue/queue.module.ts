import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';
import {
  LEAVE_REQUESTS_QUEUE,
  leaveRequestsQueueArguments,
} from './queue.constants';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'LEAVE_QUEUE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URI')!],
            queue: LEAVE_REQUESTS_QUEUE,
            queueOptions: {
              durable: true,
              // Must match the arguments the queue was declared with
              // (see queue/topology.ts) or RabbitMQ rejects the assert.
              arguments: leaveRequestsQueueArguments,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class QueueModule {}
