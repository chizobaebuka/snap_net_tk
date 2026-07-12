import { Controller, Get, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import Redis from 'ioredis';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @Inject('LEAVE_QUEUE_SERVICE') private readonly rmqClient: ClientProxy,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const dbStatus = this.dataSource.isInitialized ? 'UP' : 'DOWN';

    // Reuse the app's long-lived RMQ/Redis clients instead of opening a
    // fresh broker connection per request - this endpoint is polled
    // frequently (k8s liveness/readiness probes) and connection churn
    // adds real load on the broker at scale.
    let queueStatus = 'UP';
    try {
      await this.rmqClient.connect();
    } catch {
      queueStatus = 'DOWN';
    }

    let redisStatus = 'UP';
    try {
      await this.redis.ping();
    } catch {
      redisStatus = 'DOWN';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        rabbitmq: queueStatus,
        redis: redisStatus,
      },
    };
  }
}
