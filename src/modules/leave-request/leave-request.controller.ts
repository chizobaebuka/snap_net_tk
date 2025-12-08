import { Controller, Post, Body, Get, Param, Patch, Delete, Query } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('leave-requests')
export class LeaveRequestController {
    constructor(private readonly leaveRequestService: LeaveRequestService) { }

    @Get()
    async findAll(@Query() paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const result = await this.leaveRequestService.findAll(page, limit);
        return new ResponseDto(true, 'Leave requests fetched successfully', result.data, result.meta);
    }

    @Post()
    async create(@Body() createLeaveRequestDto: CreateLeaveRequestDto) {
        const request = await this.leaveRequestService.create(createLeaveRequestDto);
        return new ResponseDto(true, 'Leave request submitted', request);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const request = await this.leaveRequestService.findOne(id);
        return new ResponseDto(true, 'Leave request fetched successfully', request);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateLeaveRequestDto) {
        const request = await this.leaveRequestService.update(id, updateDto);
        return new ResponseDto(true, 'Leave request updated successfully', request);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.leaveRequestService.remove(id);
        return new ResponseDto(true, 'Leave request deleted successfully');
    }
}
