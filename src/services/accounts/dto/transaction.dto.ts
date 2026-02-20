import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionType } from 'src/common/enums/transaction-type.enum';

export class TransactionDto
  implements Omit<TransactionEntity, 'accountId' | 'idempotencyKey'>
{
  @ApiProperty({
    description: 'Unique transaction identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  transactionId: string;

  @ApiProperty({ description: 'Transaction value', example: 1000 })
  @Expose()
  value: number;

  @ApiProperty({
    description: 'Transaction date',
    example: '2026-01-01T00:00:00.000Z',
  })
  @Expose()
  transactionDate: Date;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.DEPOSIT,
  })
  @Expose()
  type: number;
}
