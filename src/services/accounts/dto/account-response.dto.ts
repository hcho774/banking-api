import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from 'src/common/dto/api-response.dto';
import { AccountDto } from './account.dto';

export class AccountResponseDto extends ApiResponseDto<AccountDto> {
  @ApiProperty({ type: AccountDto })
  @Expose()
  override data?: AccountDto;
}

export class AccountListResponseDto extends PaginatedResponseDto<AccountDto> {
  @ApiProperty({ type: [AccountDto] })
  @Expose()
  override data?: AccountDto[];
}
