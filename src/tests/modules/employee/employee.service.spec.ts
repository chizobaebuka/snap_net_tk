import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from '../../../modules/employee/employee.service';
import { EmployeeRepository } from '../../../modules/employee/employee.repository';
import { DepartmentRepository } from '../../../modules/department/department.repository';

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: EmployeeRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findWithLeaveHistory: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            findByDepartmentId: jest.fn(),
          },
        },
        {
          provide: DepartmentRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
