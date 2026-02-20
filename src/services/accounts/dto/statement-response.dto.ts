import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PaginatedResponseDto } from 'src/common/dto/api-response.dto';
import { TransactionDto } from './transaction.dto';

export class StatementResponseDto extends PaginatedResponseDto<TransactionDto> {
  @ApiProperty({ type: [TransactionDto] })
  @Expose()
  override data?: TransactionDto[];
}
