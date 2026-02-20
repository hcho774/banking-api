import { ApiProperty } from '@nestjs/swagger';
import { Account as PrismaAccount } from '../../../prisma/schema/account';

export class AccountEntity implements PrismaAccount {
  @ApiProperty({
    description: 'Unique account identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  accountId: string;

  @ApiProperty({ description: 'Owner person ID', example: 1 })
  personId: number;

  @ApiProperty({ description: 'Account balance', example: 10000 })
  balance: number;

  @ApiProperty({ description: 'Daily withdrawal limit', example: 5000 })
  dailyWithdrawalLimit: number;

  @ApiProperty({
    description: 'Whether the account is active',
    example: true,
  })
  activeFlag: boolean = true;

  @ApiProperty({ description: 'Account type identifier', example: 1 })
  accountType: number;

  @ApiProperty({
    description: 'Account creation date',
    example: '2026-01-01T00:00:00.000Z',
  })
  createDate: Date;
}
