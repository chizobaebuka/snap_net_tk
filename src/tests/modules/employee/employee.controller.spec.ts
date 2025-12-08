import { Test, TestingModule } from '@nestjs/testing';
import { Employee } from '../../../database/entities/employee.entity';
import { EmployeeController } from '../../../modules/employee/employee.controller';
import { EmployeeService } from '../../../modules/employee/employee.service';


describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: EmployeeService;

  const mockEmployeeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByDepartment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an employee', async () => {
      const dto = { name: 'John', email: 'john@example.com', departmentId: '1', password: 'password123' };
      const expectedResult = { id: '1', ...dto } as Employee;

      mockEmployeeService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);
      expect(result.data).toEqual(expectedResult);
      expect(mockEmployeeService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated employees', async () => {
      const expectedResult = { data: [], meta: { page: 1, limit: 10, total: 0 } };
      mockEmployeeService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result.data).toEqual(expectedResult.data);
      expect(mockEmployeeService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return an employee', async () => {
      const expectedResult = { id: '1', name: 'John' } as Employee;
      mockEmployeeService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('1');
      expect(result.data).toEqual(expectedResult);
      expect(mockEmployeeService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('findByDepartment', () => {
    it('should return employees by department', async () => {
      const expectedResult = { data: [], meta: { page: 1, limit: 10, total: 0 } };
      mockEmployeeService.findByDepartment.mockResolvedValue(expectedResult);

      const result = await controller.findByDepartment('1', { page: 1, limit: 10 });
      expect(result.data).toEqual(expectedResult.data);
      expect(mockEmployeeService.findByDepartment).toHaveBeenCalledWith('1', 1, 10);
    });
  });
});
