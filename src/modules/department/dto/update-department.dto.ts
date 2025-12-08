import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class UpdateDepartmentDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @Length(2, 50)
    name?: string;
}
