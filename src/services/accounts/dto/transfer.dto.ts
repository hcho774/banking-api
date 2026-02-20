import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    description: 'Target account ID to transfer funds to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  targetAccountId: string;

  @ApiProperty({ description: 'Transfer amount (integer, cents)', example: 5000 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Idempotency key to prevent duplicate transfers',
    example: 'transfer-001',
  })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
