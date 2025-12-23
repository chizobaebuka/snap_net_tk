
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { EmployeeService } from '../employee/employee.service';
import { CreateEmployeeDto } from '../employee/dto/create-employee.dto';
import { ResponseDto } from '../../common/dto/response.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private employeeService: EmployeeService,
    ) { }

    @Public()
    @Post('login')
    async login(@Body() req: any) {
        // Basic validation
        if (!req.email || !req.password) {
            throw new UnauthorizedException('Email and password are required');
        }
        const user = await this.authService.validateUser(req.email, req.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user); // Returns JWT
    }

    @Public()
    @Post('register')
    async register(@Body() createEmployeeDto: CreateEmployeeDto) {
        const employee = await this.employeeService.create(createEmployeeDto);
        return new ResponseDto(true, 'User registered successfully', employee);
    }
}
