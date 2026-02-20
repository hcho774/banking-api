import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { BalanceDto } from './balance.dto';

export class BalanceResponseDto extends ApiResponseDto<BalanceDto> {
  @ApiProperty({ type: BalanceDto })
  @Expose()
  override data?: BalanceDto;
}
