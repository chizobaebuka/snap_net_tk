import { IsString, IsNotEmpty, IsEmail, IsUUID } from 'class-validator';

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
}
