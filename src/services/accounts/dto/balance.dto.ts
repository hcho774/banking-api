import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BalanceDto {
  @ApiProperty({
    description: 'Unique account identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  accountId: string;

  @ApiProperty({ description: 'Current account balance', example: 10000 })
  @Expose()
  balance: number;
}
