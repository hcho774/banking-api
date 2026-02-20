import { Person as PrismaPerson } from '../../../prisma/schema/person';
import { Expose, Exclude } from 'class-transformer';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class PersonEntity implements PrismaPerson {
  @ApiHideProperty()
  @Exclude()
  personId: number;

  @ApiProperty({
    description: 'Public ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  publicId: string;

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
