import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Department } from '../database/entities/department.entity';
import { Employee } from '../database/entities/employee.entity';
import { LeaveRequest } from '../database/entities/leave-request.entity';

config();

export default new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'workforce_db',
    entities: [Department, Employee, LeaveRequest],
    migrations: ['src/database/migrations/*.ts'],
    synchronize: false, // Must be false for migrations
});
