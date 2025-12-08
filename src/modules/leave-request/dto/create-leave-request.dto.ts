import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';

export class CreateLeaveRequestDto {
    @IsUUID()
    @IsNotEmpty()
    employeeId: string;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsNotEmpty()
    endDate: string;
}
