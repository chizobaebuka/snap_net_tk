import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentController } from '../../../modules/department/department.controller';
import { DepartmentService } from '../../../modules/department/department.service';
import { Department } from '../../../database/entities/department.entity';

describe('DepartmentController', () => {
  let controller: DepartmentController;
  let service: DepartmentService;

  const mockDepartmentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [
        {
          provide: DepartmentService,
          useValue: mockDepartmentService,
        },
      ],
    }).compile();

    controller = module.get<DepartmentController>(DepartmentController);
    service = module.get<DepartmentService>(DepartmentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a department', async () => {
      const dto = { name: 'IT' };
      const expectedResult = { id: '1', ...dto, createdAt: new Date() } as Department;

      mockDepartmentService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);
      expect(result.data).toEqual(expectedResult);
      expect(mockDepartmentService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated departments', async () => {
      const expectedResult = { data: [], meta: { page: 1, limit: 10, total: 0 } };
      mockDepartmentService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result.data).toEqual(expectedResult.data);
      expect(mockDepartmentService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('findOne', () => {
    it('should return a department', async () => {
      const expectedResult = { id: '1', name: 'IT' } as Department;
      mockDepartmentService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('1');
      expect(result.data).toEqual(expectedResult);
      expect(mockDepartmentService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a department', async () => {
      const dto = { name: 'HR' };
      const expectedResult = { id: '1', name: 'HR' } as Department;
      mockDepartmentService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('1', dto);
      expect(result.data).toEqual(expectedResult);
      expect(mockDepartmentService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should delete a department', async () => {
      mockDepartmentService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');
      expect(result.success).toBe(true);
      expect(mockDepartmentService.remove).toHaveBeenCalledWith('1');
    });
  });
});
