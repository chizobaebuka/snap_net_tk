import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

describe('PaginationDto', () => {
  it('accepts a limit within the allowed range', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1, limit: 50 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a limit above the cap to prevent unbounded queries', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1, limit: 100000 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('defaults to page 1 / limit 10 when omitted', () => {
    const dto = plainToInstance(PaginationDto, {});
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });
});
