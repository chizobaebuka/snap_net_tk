import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestController } from '../../../modules/leave-request/leave-request.controller';
import { LeaveRequestService } from '../../../modules/leave-request/leave-request.service';

describe('LeaveRequestController', () => {
  let controller: LeaveRequestController;
  let service: LeaveRequestService;

  const mockLeaveRequestService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveRequestController],
      providers: [
        {
          provide: LeaveRequestService,
          useValue: mockLeaveRequestService,
        },
      ],
    }).compile();

    controller = module.get<LeaveRequestController>(LeaveRequestController);
    service = module.get<LeaveRequestService>(LeaveRequestService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a leave request', async () => {
      const dto = { employeeId: '1', startDate: '2023-01-01', endDate: '2023-01-05' };
      const expectedResult = { id: '1', ...dto } as any; // Using any to partial mock

      mockLeaveRequestService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);
      expect(result.data).toEqual(expectedResult);
      expect(mockLeaveRequestService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated leave requests', async () => {
      const expectedResult = { data: [], meta: { page: 1, limit: 10, total: 0 } };
      mockLeaveRequestService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll({ page: 1, limit: 10 });
      expect(result.data).toEqual(expectedResult.data);
      expect(mockLeaveRequestService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('update', () => {
    it('should update a leave request', async () => {
      const dto = { startDate: '2023-01-02' };
      const expectedResult = { id: '1', ...dto } as any;

      mockLeaveRequestService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('1', dto);
      expect(result.data).toEqual(expectedResult);
      expect(mockLeaveRequestService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should delete a leave request', async () => {
      mockLeaveRequestService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');
      expect(result.success).toBe(true);
      expect(mockLeaveRequestService.remove).toHaveBeenCalledWith('1');
    });
  });
});
