import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DepartmentRepository } from './department.repository';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PaginationHelper } from '../../common/utils/pagination.helper';
import { Department } from '../../database/entities/department.entity';

@Injectable()
export class DepartmentService {
    constructor(private readonly departmentRepository: DepartmentRepository) { }

    async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
        const existing = await this.departmentRepository.findByName(createDepartmentDto.name);
        if (existing) {
            throw new ConflictException('Department with this name already exists');
        }

        const department = this.departmentRepository.create(createDepartmentDto);
        return this.departmentRepository.save(department);
    }

    async findAll(page: number, limit: number) {
        const [departments, total] = await this.departmentRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return PaginationHelper.paginate(departments, total, page, limit);
    }

    async findOne(id: string): Promise<Department> {
        const department = await this.departmentRepository.findOne({ where: { id } });
        if (!department) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }
        return department;
    }

    async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
        const department = await this.findOne(id);
        if (updateDepartmentDto.name) {
            const existing = await this.departmentRepository.findByName(updateDepartmentDto.name);
            if (existing && existing.id !== id) {
                throw new ConflictException('Department with this name already exists');
            }
        }
        Object.assign(department, updateDepartmentDto);
        return this.departmentRepository.save(department);
    }

    async remove(id: string): Promise<void> {
        const department = await this.departmentRepository.findOne({
            where: { id },
            relations: ['employees'],
        });

        if (!department) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }

        if (department.employees && department.employees.length > 0) {
            throw new ConflictException(
                `Cannot delete department. It has ${department.employees.length} employee(s) assigned. Please reassign or remove employees first.`
            );
        }

        await this.departmentRepository.remove(department);
    }
}
