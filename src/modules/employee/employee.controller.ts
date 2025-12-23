import { Controller, Post, Body, Get, Param, Query, Patch, Delete } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmployeeRole } from '../../database/entities/employee.entity';

@Controller()
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) { }

    @Roles(EmployeeRole.ADMIN)
    @Get('employees')
    async findAll(@Query() paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const result = await this.employeeService.findAll(page, limit);
        return new ResponseDto(true, 'Employees fetched successfully', result.data, result.meta);
    }

    @Roles(EmployeeRole.ADMIN)
    @Post('employees')
    async create(@Body() createEmployeeDto: CreateEmployeeDto) {
        const employee = await this.employeeService.create(createEmployeeDto);
        return new ResponseDto(true, 'Employee created successfully', employee);
    }

    @Get('employees/:id')
    async findOne(@Param('id') id: string) {
        const employee = await this.employeeService.findOne(id);
        return new ResponseDto(true, 'Employee fetched successfully', employee);
    }

    @Patch('employees/:id')
    async update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
        const employee = await this.employeeService.update(id, updateEmployeeDto);
        return new ResponseDto(true, 'Employee updated successfully', employee);
    }

    @Roles(EmployeeRole.ADMIN)
    @Delete('employees/:id')
    async remove(@Param('id') id: string) {
        await this.employeeService.remove(id);
        return new ResponseDto(true, 'Employee deleted successfully');
    }

    @Roles(EmployeeRole.ADMIN)
    @Get('departments/:id/employees')
    async findByDepartment(
        @Param('id') departmentId: string,
        @Query() paginationDto: PaginationDto,
    ) {
        const { page = 1, limit = 10 } = paginationDto;
        const result = await this.employeeService.findByDepartment(departmentId, page, limit);
        return new ResponseDto(true, 'Employees fetched successfully', result.data, result.meta);
    }
}
