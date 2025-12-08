
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmployeeRepository } from '../employee/employee.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private employeeRepository: EmployeeRepository,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const employee = await this.employeeRepository.findOne({
            where: { email },
            select: ['id', 'email', 'role', 'password', 'departmentId'],
        });

        if (employee && employee.password && await bcrypt.compare(pass, employee.password)) {
            const { password, ...result } = employee;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
