import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';


@Entity('departments')
export class Department extends BaseEntity {
    @Column({ unique: true })
    name: string;

    @OneToMany(() => Employee, (employee) => employee.department)
    employees: Employee[];
}
