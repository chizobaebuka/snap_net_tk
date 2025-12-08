import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
        return next.handle().pipe(
            map(data => {
                if (data instanceof ResponseDto) {
                    return data;
                }
                return new ResponseDto(true, 'Success', data);
            }),
        );
    }
}
