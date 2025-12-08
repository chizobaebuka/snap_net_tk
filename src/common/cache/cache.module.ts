import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (configService: ConfigService) => {
                const uri = configService.get<string>('REDIS_URI');
                if (!uri) {
                    throw new Error('REDIS_URI is not defined');
                }
                return new Redis(uri);
            },
            inject: [ConfigService],
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class CacheModule { }
