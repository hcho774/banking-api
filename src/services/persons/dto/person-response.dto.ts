import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from 'src/common/dto/api-response.dto';
import { PersonEntity } from '../entities/person.entity';

export class PersonResponseDto extends ApiResponseDto<PersonEntity> {
  @ApiProperty({ type: PersonEntity })
  @Expose()
  override data?: PersonEntity;
}

export class PersonListResponseDto extends PaginatedResponseDto<PersonEntity> {
  @ApiProperty({ type: [PersonEntity] })
  @Expose()
  override data?: PersonEntity[];
}
