import { Injectable, Inject, NotFoundException } from '@nestjs/common';
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
        const employee = await this.employeeRepository.findOne({ where: { id: createLeaveRequestDto.employeeId } });

        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        const leaveRequest = this.leaveRequestRepository.create({
            ...createLeaveRequestDto,
            status: LeaveStatus.PENDING,
            employee,
        });

        const savedRequest = await this.leaveRequestRepository.save(leaveRequest);

        // Publish to queue
        this.client.emit('leave.requested', {
            leaveRequestId: savedRequest.id,
            employeeId: savedRequest.employeeId,
            departmentId: employee.departmentId,
            startDate: savedRequest.startDate,
            endDate: savedRequest.endDate,
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
