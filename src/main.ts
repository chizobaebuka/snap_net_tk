import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import {
  LEAVE_REQUESTS_QUEUE,
  leaveRequestsQueueArguments,
} from './queue/queue.constants';
import { setupQueueTopology } from './queue/topology';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security & performance middleware
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || '*',
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Interceptors & Filters
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Let Nest drain in-flight requests and close DB/Redis/RMQ connections
  // cleanly on SIGTERM (required for zero-downtime rolling deploys).
  app.enableShutdownHooks();

  const rabbitmqUri = configService.get<string>('RABBITMQ_URI')!;

  // Ensure the dead-letter exchange/queue exist before the consumer starts,
  // otherwise messages that exhaust their retries would be silently dropped.
  await setupQueueTopology(rabbitmqUri);

  // Microservice for RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUri],
      queue: LEAVE_REQUESTS_QUEUE,
      queueOptions: {
        durable: true,
        arguments: leaveRequestsQueueArguments,
      },
      // Bounds how many unacked messages this instance holds at once, so
      // running multiple worker replicas actually load-balances between them
      // instead of one replica hoarding the backlog.
      prefetchCount: configService.get<number>('RABBITMQ_PREFETCH_COUNT') || 10,
      noAck: false, // Manual Ack
    },
  });

  await app.startAllMicroservices();
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
bootstrap().catch((err) => {
  // Fail loudly and exit non-zero so the orchestrator (systemd/k8s/PM2)
  // knows to restart instead of leaving a half-started process running.

  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});
