import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Department } from '../../database/entities/department.entity';

@Injectable()
export class DepartmentRepository extends Repository<Department> {
    constructor(private dataSource: DataSource) {
        super(Department, dataSource.createEntityManager());
    }

    async findByName(name: string): Promise<Department | null> {
        return this.findOne({ where: { name } });
    }
}
