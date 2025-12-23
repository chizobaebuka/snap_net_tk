import { IsString, IsNotEmpty, IsEmail, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { EmployeeRole } from '../../../database/entities/employee.entity';

export class CreateEmployeeDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsUUID()
    departmentId: string;

    @IsString()
    password: string;

    @IsEnum(EmployeeRole)
    @IsOptional()
    role?: EmployeeRole;
}
