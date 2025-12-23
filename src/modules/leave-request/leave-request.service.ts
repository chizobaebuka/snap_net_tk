import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LeaveRequestRepository } from './leave-request.repository';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveStatus } from '../../database/entities/leave-request.entity';
import { EmployeeRepository } from '../employee/employee.repository';
import { PaginationHelper } from '../../common/utils/pagination.helper';

@Injectable()
export class LeaveRequestService {
    constructor(
        private readonly leaveRequestRepository: LeaveRequestRepository,
        private readonly employeeRepository: EmployeeRepository,
        @Inject('LEAVE_QUEUE_SERVICE') private readonly client: ClientProxy,
    ) { }

    async create(createLeaveRequestDto: CreateLeaveRequestDto) {
        const employee = await this.employeeRepository.findOne({
            where: { id: createLeaveRequestDto.employeeId }
        });

        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        const startDate = new Date(createLeaveRequestDto.startDate);
        const endDate = new Date(createLeaveRequestDto.endDate);

        if (endDate < startDate) {
            throw new BadRequestException('End date cannot be before start date');
        }

        // Check for overlapping leave requests
        const overlappingRequests = await this.leaveRequestRepository
            .createQueryBuilder('leave')
            .where('leave.employeeId = :employeeId', { employeeId: employee.id })
            .andWhere('leave.status IN (:...statuses)', {
                statuses: [
                    LeaveStatus.PENDING,
                    LeaveStatus.APPROVED,
                    LeaveStatus.PENDING_APPROVAL
                ]
            })
            .andWhere(
                '(leave.startDate <= :endDate AND leave.endDate >= :startDate)',
                {
                    startDate: createLeaveRequestDto.startDate,
                    endDate: createLeaveRequestDto.endDate
                }
            )
            .getMany();

        if (overlappingRequests.length > 0) {
            throw new BadRequestException(
                `You already have a leave request during this period (${overlappingRequests[0].startDate} to ${overlappingRequests[0].endDate})`
            );
        }

        const leaveRequest = this.leaveRequestRepository.create({
            ...createLeaveRequestDto,
            status: LeaveStatus.PENDING,
            employee,
        });

        const savedRequest = await this.leaveRequestRepository.save(leaveRequest);

        this.client.emit('leave.requested', {
            leaveRequestId: savedRequest.id,
            employeeId: savedRequest.employeeId,
            departmentId: employee.departmentId,
            startDate: savedRequest.startDate,
            endDate: savedRequest.endDate
        });

        return savedRequest;
    }

    async findAll(page: number, limit: number) {
        const [requests, total] = await this.leaveRequestRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
            relations: ['employee'],
        });
        return PaginationHelper.paginate(requests, total, page, limit);
    }

    async findOne(id: string) {
        const request = await this.leaveRequestRepository.findOne({ where: { id }, relations: ['employee'] });
        if (!request) throw new NotFoundException('Leave request not found');
        return request;
    }

    async update(id: string, updateDto: UpdateLeaveRequestDto) {
        const request = await this.findOne(id);
        Object.assign(request, updateDto);
        return this.leaveRequestRepository.save(request);
    }

    async remove(id: string) {
        const request = await this.findOne(id);
        await this.leaveRequestRepository.remove(request);
    }
}
