// src/persons/dto/create-person.dto.ts
import { OmitType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { PersonEntity } from '../entities/person.entity';

export class CreatePersonDto extends OmitType(PersonEntity, [
  'personId',
] as const) {
  @IsString()
  @IsNotEmpty()
  publicId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  document: string;

  @IsDateString()
  birthDate: Date;
}
