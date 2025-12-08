import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

export enum LeaveStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PENDING_APPROVAL = 'PENDING_APPROVAL', // Queue processed but needs manual approval (logic > 2 days)
}

@Entity('leave_requests')
@Index(['startDate', 'endDate']) // Composite index for date range queries
export class LeaveRequest extends BaseEntity {
    @Column()
    @Index() // Index for employee history lookups
    employeeId: string;

    @Column({ type: 'date' })
    startDate: Date;

    @Column({ type: 'date' })
    endDate: Date;

    @Column({
        type: 'enum',
        enum: LeaveStatus,
        default: LeaveStatus.PENDING,
    })
    @Index() // Index for filtering by status
    status: LeaveStatus;

    @Column({ type: 'timestamp', nullable: true })
    processedAt: Date; // For idempotency/audit

    @ManyToOne(() => Employee, (employee) => employee.leaveRequests)
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;
}
