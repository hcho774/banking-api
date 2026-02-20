import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from 'src/common/enums/account-type.enum';

export class UpdateAccountDto {
  @ApiPropertyOptional({ description: 'Daily withdrawal limit', example: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyWithdrawalLimit?: number;

  @ApiPropertyOptional({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.CHECKING,
  })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: number;
}
