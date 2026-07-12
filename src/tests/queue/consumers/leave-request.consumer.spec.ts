import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestConsumer } from '../../../queue/consumers/leave-request.consumer';
import { LeaveRequestRepository } from '../../../modules/leave-request/leave-request.repository';
import { LeaveStatus } from '../../../database/entities/leave-request.entity';

describe('LeaveRequestConsumer', () => {
  let consumer: LeaveRequestConsumer;
  let repository: LeaveRequestRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveRequestConsumer],
      providers: [
        {
          provide: LeaveRequestRepository,
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    consumer = module.get<LeaveRequestConsumer>(LeaveRequestConsumer);
    repository = module.get<LeaveRequestRepository>(LeaveRequestRepository);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should auto-approve leave request <= 2 days', async () => {
    const leaveRequest = {
      id: '1',
      status: LeaveStatus.PENDING,
      startDate: new Date('2023-10-01'),
      endDate: new Date('2023-10-02'), // 2 days
    };

    const context = {
      getChannelRef: () => ({ ack: jest.fn(), nack: jest.fn() }),
      getMessage: () => ({}),
    } as any;

    jest.spyOn(repository, 'findOne').mockResolvedValue(leaveRequest as any);
    jest.spyOn(repository, 'save').mockResolvedValue(leaveRequest as any);

    await consumer.handleLeaveRequest({ leaveRequestId: '1' }, context);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: LeaveStatus.APPROVED,
      }),
    );
  });

  it('should require approval for leave request > 2 days', async () => {
    const leaveRequest = {
      id: '2',
      status: LeaveStatus.PENDING,
      startDate: new Date('2023-10-01'),
      endDate: new Date('2023-10-04'), // 4 days
    };

    const context = {
      getChannelRef: () => ({ ack: jest.fn() }),
      getMessage: () => ({}),
    } as any;

    jest.spyOn(repository, 'findOne').mockResolvedValue(leaveRequest as any);
    jest.spyOn(repository, 'save').mockResolvedValue(leaveRequest as any);

    await consumer.handleLeaveRequest({ leaveRequestId: '2' }, context);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: LeaveStatus.PENDING_APPROVAL,
      }),
    );
  });

  it('should republish with an incremented retry count when retries remain', async () => {
    jest.useFakeTimers();

    const leaveRequest = {
      id: '3',
      status: LeaveStatus.PENDING,
      startDate: new Date('2023-10-01'),
      endDate: new Date('2023-10-02'),
    };

    const channel = { ack: jest.fn(), nack: jest.fn(), publish: jest.fn() };
    const originalMsg = {
      properties: { headers: {} },
      fields: { exchange: '', routingKey: 'leave_requests_queue' },
      content: Buffer.from(JSON.stringify({ leaveRequestId: '3' })),
    };
    const context = {
      getChannelRef: () => channel,
      getMessage: () => originalMsg,
    } as any;

    jest.spyOn(repository, 'findOne').mockResolvedValue(leaveRequest as any);
    jest.spyOn(repository, 'save').mockRejectedValue(new Error('DB blip'));

    const handling = consumer.handleLeaveRequest(
      { leaveRequestId: '3' },
      context,
    );
    await jest.runOnlyPendingTimersAsync();
    await handling;

    expect(channel.publish).toHaveBeenCalledWith(
      '',
      'leave_requests_queue',
      originalMsg.content,
      { headers: { 'x-retry-count': 1 } },
    );
    expect(channel.ack).toHaveBeenCalledWith(originalMsg);
    expect(channel.nack).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should nack to the DLQ once retries are exhausted', async () => {
    const leaveRequest = {
      id: '4',
      status: LeaveStatus.PENDING,
      startDate: new Date('2023-10-01'),
      endDate: new Date('2023-10-02'),
    };

    const channel = { ack: jest.fn(), nack: jest.fn(), publish: jest.fn() };
    const originalMsg = {
      properties: { headers: { 'x-retry-count': 3 } },
      fields: { exchange: '', routingKey: 'leave_requests_queue' },
      content: Buffer.from(JSON.stringify({ leaveRequestId: '4' })),
    };
    const context = {
      getChannelRef: () => channel,
      getMessage: () => originalMsg,
    } as any;

    jest.spyOn(repository, 'findOne').mockResolvedValue(leaveRequest as any);
    jest.spyOn(repository, 'save').mockRejectedValue(new Error('DB down'));

    await consumer.handleLeaveRequest({ leaveRequestId: '4' }, context);

    expect(channel.nack).toHaveBeenCalledWith(originalMsg, false, false);
    expect(channel.publish).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });
});
