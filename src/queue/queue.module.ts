import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService, ConfigModule } from '@nestjs/config';

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
                        queue: 'leave_requests_queue',
                        queueOptions: {
                            durable: true,
                            arguments: {
                                'x-dead-letter-exchange': '',
                                'x-dead-letter-routing-key': 'leave_requests_dlq',
                            },
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class QueueModule { }
