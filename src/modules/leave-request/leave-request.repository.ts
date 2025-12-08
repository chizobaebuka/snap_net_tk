import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LeaveRequest } from '../../database/entities/leave-request.entity';

@Injectable()
export class LeaveRequestRepository extends Repository<LeaveRequest> {
    constructor(private dataSource: DataSource) {
        super(LeaveRequest, dataSource.createEntityManager());
    }
}
