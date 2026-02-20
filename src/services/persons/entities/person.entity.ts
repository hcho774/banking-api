import { Person as PrismaPerson } from '../../../prisma/schema/person';

export class PersonEntity implements PrismaPerson {
  personId: number;
  publicId: string;
  name: string;
  document: string;
  birthDate: Date;
  status: number;
  deletedAt?: Date;
}
