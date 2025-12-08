import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { EmployeeRepository } from './employee.repository';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from '../../database/entities/employee.entity';
import { DepartmentRepository } from '../department/department.repository';
import Redis from 'ioredis';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
    constructor(
        private readonly employeeRepository: EmployeeRepository,
        private readonly departmentRepository: DepartmentRepository,
        @Inject('REDIS_CLIENT') private readonly redis: Redis,
    ) { }

    async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
        const department = await this.departmentRepository.findOne({
            where: { id: createEmployeeDto.departmentId }
        });

        if (!department) {
            throw new NotFoundException('Department not found');
        }

        const employee = this.employeeRepository.create({
            ...createEmployeeDto,
            department,
        });

        employee.password = await bcrypt.hash(createEmployeeDto.password, 10);

        return this.employeeRepository.save(employee);
    }

    async findOne(id: string): Promise<Employee> {
        const cacheKey = `employee:${id}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        const employee = await this.employeeRepository.findWithLeaveHistory(id);
        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        await this.redis.set(cacheKey, JSON.stringify(employee), 'EX', 3600); // Cache for 1 hour
        return employee;
    }

    async findAll(page: number, limit: number) {
        const [employees, total] = await this.employeeRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
            relations: ['department'],
        });
        return PaginationHelper.paginate(employees, total, page, limit);
    }

    async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
        const employee = await this.employeeRepository.findOne({ where: { id } }); // Don't use findOne service method to avoid cache issues/stale data for update
        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        if (updateEmployeeDto.departmentId) {
            const department = await this.departmentRepository.findOne({ where: { id: updateEmployeeDto.departmentId } });
            if (!department) throw new NotFoundException('Department not found');
            employee.department = department;
        }

        Object.assign(employee, updateEmployeeDto);
        const saved = await this.employeeRepository.save(employee);

        // Invalidate cache
        await this.redis.del(`employee:${id}`);

        return saved;
    }

    async remove(id: string): Promise<void> {
        const employee = await this.employeeRepository.findOne({ where: { id } });
        if (!employee) throw new NotFoundException('Employee not found');

        await this.employeeRepository.remove(employee);
        await this.redis.del(`employee:${id}`);
    }

    async findByDepartment(departmentId: string, page: number, limit: number) {
        const [employees, total] = await this.employeeRepository.findByDepartmentId(departmentId, page, limit);
        return PaginationHelper.paginate(employees, total, page, limit);
    }
}
