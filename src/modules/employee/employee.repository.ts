import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Employee } from '../../database/entities/employee.entity';

@Injectable()
export class EmployeeRepository extends Repository<Employee> {
    constructor(private dataSource: DataSource) {
        super(Employee, dataSource.createEntityManager());
    }

    async findByDepartmentId(departmentId: string, page: number, limit: number): Promise<[Employee[], number]> {
        return this.findAndCount({
            where: { departmentId },
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });
    }

    async findWithLeaveHistory(id: string): Promise<Employee | null> {
        return this.findOne({
            where: { id },
            relations: ['leaveRequests'],
            order: {
                leaveRequests: {
                    createdAt: 'DESC'
                }
            }
        });
    }
}
