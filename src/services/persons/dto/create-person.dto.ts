import { IsString, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePersonDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description:
      'Government-issued identification number (e.g. SSN, passport)',
    example: '123-456-789',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({ description: 'Date of birth', example: '1990-01-01' })
  @IsDate()
  @Type(() => Date)
  birthDate: Date;
}
