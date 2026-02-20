import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({ description: 'Deposit amount', example: 1000 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Idempotency key to prevent duplicate deposits',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
