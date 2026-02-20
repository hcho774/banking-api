import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from 'src/common/dto/api-response.dto';
import { PersonDto } from './person.dto';

export class PersonResponseDto extends ApiResponseDto<PersonDto> {
  @ApiProperty({ type: PersonDto })
  @Expose()
  override data?: PersonDto;
}

export class PersonListResponseDto extends PaginatedResponseDto<PersonDto> {
  @ApiProperty({ type: [PersonDto] })
  @Expose()
  override data?: PersonDto[];
}
