import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Department } from './department.entity';
import { LeaveRequest } from './leave-request.entity';

export enum EmployeeRole {
    ADMIN = 'ADMIN',
    EMPLOYEE = 'EMPLOYEE',
}

@Entity('employees')
export class Employee extends BaseEntity {
    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    @Column({ type: 'enum', enum: EmployeeRole, default: EmployeeRole.EMPLOYEE })
    role: EmployeeRole;

    @Column({ select: false, nullable: true }) // Nullable for existing users, select: false for security
    password: string;

    @Column()
    @Index() // Index for faster department lookups
    departmentId: string;

    @ManyToOne(() => Department, (department) => department.employees)
    @JoinColumn({ name: 'departmentId' })
    department: Department;

    @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.employee)
    leaveRequests: LeaveRequest[];
}
