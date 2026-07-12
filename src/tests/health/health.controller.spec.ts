import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../health/health.controller';
import { DataSource } from 'typeorm';

describe('HealthController', () => {
  let controller: HealthController;
  let rmqClient: { connect: jest.Mock };
  let redis: { ping: jest.Mock };

  beforeEach(async () => {
    rmqClient = { connect: jest.fn().mockResolvedValue(undefined) };
    redis = { ping: jest.fn().mockResolvedValue('PONG') };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: DataSource, useValue: { isInitialized: true } },
        { provide: 'LEAVE_QUEUE_SERVICE', useValue: rmqClient },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('reuses the injected RMQ client instead of opening a new connection', async () => {
    const result = await controller.check();

    expect(rmqClient.connect).toHaveBeenCalledTimes(1);
    expect(result.services.rabbitmq).toBe('UP');
    expect(result.services.database).toBe('UP');
    expect(result.services.redis).toBe('UP');
  });

  it('reports DOWN when the broker connection fails', async () => {
    rmqClient.connect.mockRejectedValueOnce(new Error('connection refused'));

    const result = await controller.check();

    expect(result.services.rabbitmq).toBe('DOWN');
  });

  it('reports DOWN when redis is unreachable', async () => {
    redis.ping.mockRejectedValueOnce(new Error('timeout'));

    const result = await controller.check();

    expect(result.services.redis).toBe('DOWN');
  });
});
