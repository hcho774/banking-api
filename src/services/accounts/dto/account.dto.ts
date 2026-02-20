import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AccountEntity } from '../entities/account.entity';
import { AccountType } from 'src/common/enums/account-type.enum';

export class AccountDto
  implements Omit<AccountEntity, 'personId'>
{
  @ApiProperty({
    description: 'Unique account identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  accountId: string;

  @ApiProperty({ description: 'Account balance', example: 10000 })
  @Expose()
  balance: number;

  @ApiProperty({ description: 'Daily withdrawal limit', example: 5000 })
  @Expose()
  dailyWithdrawalLimit: number;

  @ApiProperty({ description: 'Whether the account is active', example: true })
  @Expose()
  activeFlag: boolean;

  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.CHECKING,
  })
  @Expose()
  accountType: number;

  @ApiProperty({
    description: 'Account creation date',
    example: '2026-01-01T00:00:00.000Z',
  })
  @Expose()
  createDate: Date;
}
