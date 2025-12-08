import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { EmployeeRole } from '../../database/entities/employee.entity';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<EmployeeRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user; // Populated by JwtAuthGuard

        if (!user) {
            // If used fast, maybe AuthGuard didn't run or is optional? 
            // Better to assume unauthorized if no user and roles are required
            throw new UnauthorizedException('User not authenticated');
        }

        // Check if user role matches one of the required roles
        return requiredRoles.some((role) => user.role === role);
    }
}
