import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisClient');
        const uri = configService.get<string>('REDIS_URI');
        if (!uri) {
          throw new Error('REDIS_URI is not defined');
        }

        const client = new Redis(uri, {
          // Bounded exponential backoff so a Redis blip doesn't spin-loop
          // reconnects or leave requests hanging indefinitely.
          retryStrategy: (times) => Math.min(times * 200, 5000),
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          connectionName: 'workforce-api',
        });

        // ioredis crashes the process on an unhandled 'error' event -
        // log instead so transient network issues degrade gracefully.
        client.on('error', (err) =>
          logger.error(`Redis connection error: ${err.message}`),
        );

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class CacheModule {}
