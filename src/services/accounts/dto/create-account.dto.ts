import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from 'src/common/enums/account-type.enum';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Public ID of the account owner (person)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  personPublicId: string;

  @ApiProperty({ description: 'Daily withdrawal limit', example: 5000 })
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  dailyWithdrawalLimit: number;

  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.CHECKING,
  })
  @IsEnum(AccountType)
  @IsNotEmpty()
  accountType: number;

  @ApiPropertyOptional({
    description: 'Initial balance',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  balance?: number = 0;
}
