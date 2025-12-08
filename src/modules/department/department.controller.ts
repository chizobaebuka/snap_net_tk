import { Controller, Post, Body, Get, Param, Patch, Delete, Query } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('departments')
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) { }

    @Post()
    async create(@Body() createDepartmentDto: CreateDepartmentDto) {
        const department = await this.departmentService.create(createDepartmentDto);
        return new ResponseDto(true, 'Department created successfully', department);
    }

    @Get()
    async findAll(@Query() paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const result = await this.departmentService.findAll(page, limit);
        return new ResponseDto(true, 'Departments fetched successfully', result.data, result.meta);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const department = await this.departmentService.findOne(id);
        return new ResponseDto(true, 'Department fetched successfully', department);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
        const department = await this.departmentService.update(id, updateDepartmentDto);
        return new ResponseDto(true, 'Department updated successfully', department);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.departmentService.remove(id);
        return new ResponseDto(true, 'Department deleted successfully');
    }
}
