import { IsString, IsNotEmpty, IsEmail, IsUUID, IsOptional } from 'class-validator';

export class UpdateEmployeeDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsUUID()
    departmentId?: string;
}
