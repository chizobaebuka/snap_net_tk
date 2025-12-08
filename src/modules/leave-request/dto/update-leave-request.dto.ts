import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { LeaveStatus } from '../../../database/entities/leave-request.entity';

export class UpdateLeaveRequestDto {
    @IsOptional()
    @IsDateString()
    @IsNotEmpty()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    @IsNotEmpty()
    endDate?: string;

    @IsOptional()
    @IsEnum(LeaveStatus)
    status?: LeaveStatus;
}
