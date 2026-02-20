import { ApiProperty } from '@nestjs/swagger';
import { AccountResponseDto } from './account-response.dto';

export class TransferResponseDataDto {
  @ApiProperty({ description: 'Updated source account' })
  sourceAccount: AccountResponseDto;

  @ApiProperty({ description: 'Updated target account' })
  targetAccount: AccountResponseDto;
}

export class TransferResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: TransferResponseDataDto })
  data: TransferResponseDataDto;
}
