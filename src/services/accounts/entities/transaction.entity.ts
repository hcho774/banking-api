import { ApiProperty } from '@nestjs/swagger';
import { Transaction as PrismaTransaction } from '../../../prisma/schema/transaction';

export class TransactionEntity implements PrismaTransaction {
  @ApiProperty({
    description: 'Unique transaction identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Associated account ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  accountId: string;

  @ApiProperty({ description: 'Transaction value', example: 1000 })
  value: number;

  @ApiProperty({
    description: 'Transaction date',
    example: '2026-01-01T00:00:00.000Z',
  })
  transactionDate: Date;

  @ApiProperty({
    description: 'Idempotency key',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  idempotencyKey: string;

  @ApiProperty({
    description: 'Transaction type (1=DEPOSIT, 2=WITHDRAWAL)',
    example: 1,
  })
  type: number;
}
