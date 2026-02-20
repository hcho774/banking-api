import { Person as PrismaPerson } from '../../../prisma/schema/person';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PersonEntity implements PrismaPerson {
  @ApiProperty({ description: 'Person ID', example: 1 })
  @Expose()
  personId: number;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Unique document number',
    example: '123-456-789',
  })
  @Expose()
  document: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01T00:00:00.000Z',
  })
  @Expose()
  birthDate: Date;
}
