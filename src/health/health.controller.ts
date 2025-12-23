import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Transport, ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
    private rmqClient: ClientProxy;

    constructor(
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
    ) {
        this.rmqClient = ClientProxyFactory.create({
            transport: Transport.RMQ,
            options: {
                urls: [this.configService.get<string>('RABBITMQ_URI')!],
                queue: 'leave_requests_queue',
            }
        });
    }

    @Get()
    async check() {
        const dbStatus = this.dataSource.isInitialized ? 'UP' : 'DOWN';
        let queueStatus = 'UNKNOWN';

        try {
            await this.rmqClient.connect();
            queueStatus = 'UP';
            this.rmqClient.close();
        } catch (e) {
            queueStatus = 'DOWN';
        }

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus,
                rabbitmq: queueStatus,
            },
        };
    }
}
