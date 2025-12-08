import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestRepository } from './leave-request.repository';
import { LeaveRequest } from '../../database/entities/leave-request.entity';
import { EmployeeModule } from '../employee/employee.module';
import { LeaveRequestConsumer } from '../../queue/consumers/leave-request.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest]),
    EmployeeModule,
  ],
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService, LeaveRequestRepository, LeaveRequestConsumer],
  exports: [LeaveRequestService, LeaveRequestRepository],
})
export class LeaveRequestModule { }
