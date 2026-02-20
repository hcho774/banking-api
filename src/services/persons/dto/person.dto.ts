import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Mask } from 'src/common/decorators/mask.decorator';
import { PersonEntity } from '../entities/person.entity';
import { PersonStatus } from 'src/common/enums/person-status.enum';

export class PersonDto implements Omit<PersonEntity, 'personId' | 'deletedAt'> {
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
    description: 'Government-issued identification number (masked)',
    example: '***-**-6789',
  })
  @Expose()
  @Mask({ type: 'tail', visibleChars: 4 })
  document: string;

  @ApiProperty({
    description: 'Person status',
    enum: PersonStatus,
    example: PersonStatus.ACTIVE,
  })
  @Expose()
  status: number;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-01T00:00:00.000Z',
  })
  @Expose()
  birthDate: Date;
}
