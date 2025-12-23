import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestConsumer } from './consumers/leave-request.consumer';
import { LeaveRequest } from '../database/entities/leave-request.entity';
import { LeaveRequestRepository } from '../modules/leave-request/leave-request.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([LeaveRequest]),
    ],
    controllers: [LeaveRequestConsumer], // Consumers are controllers in NestJS microservices
    providers: [LeaveRequestRepository],
})
export class ConsumerModule { }
