import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestService } from '../../../modules/leave-request/leave-request.service';
import { LeaveRequestRepository } from '../../../modules/leave-request/leave-request.repository';
import { EmployeeRepository } from '../../../modules/employee/employee.repository';

describe('LeaveRequestService', () => {
  let service: LeaveRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveRequestService,
        {
          provide: LeaveRequestRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: EmployeeRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: 'LEAVE_QUEUE_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LeaveRequestService>(LeaveRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
