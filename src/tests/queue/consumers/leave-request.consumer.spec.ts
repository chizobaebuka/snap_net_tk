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

        expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
            status: LeaveStatus.APPROVED
        }));
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

        expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
            status: LeaveStatus.PENDING_APPROVAL
        }));
    });
});
