import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawDto {
  @ApiProperty({ description: 'Withdrawal amount', example: 500 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Idempotency key to prevent duplicate withdrawals',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
