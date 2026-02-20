import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Person as PrismaPerson } from '../../../prisma/schema/person';

export class PersonEntity implements PrismaPerson {
  @ApiProperty({ description: 'Internal auto-increment ID', example: 1 })
  personId: number;

  @ApiProperty({
    description: 'Public-facing unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  publicId: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  name: string;

  @ApiProperty({
    description: 'Government-issued identification number',
    example: '123-45-6789',
  })
  document: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01T00:00:00.000Z',
  })
  birthDate: Date;

  @ApiProperty({
    description: 'Person status (1=ACTIVE, 2=INACTIVE, 3=DELETED)',
    example: 1,
  })
  status: number;

  @ApiPropertyOptional({
    description: 'Soft delete timestamp (null if active)',
    example: null,
  })
  deletedAt?: Date;
}
