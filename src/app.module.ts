import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentModule } from './modules/department/department.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { LeaveRequestModule } from './modules/leave-request/leave-request.module';
import { Department } from './database/entities/department.entity';
import { Employee } from './database/entities/employee.entity';
import { LeaveRequest } from './database/entities/leave-request.entity';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './common/cache/cache.module';
import { QueueModule } from './queue/queue.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Department, Employee, LeaveRequest],
        synchronize: true, // Only for dev, in prod use migrations
        logging: false,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    CacheModule,
    QueueModule,
    DepartmentModule,
    EmployeeModule,
    LeaveRequestModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule { }
