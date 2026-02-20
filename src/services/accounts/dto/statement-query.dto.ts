import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsDate } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class StatementQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Start date (inclusive)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({
    description: 'End date (inclusive)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;
}
