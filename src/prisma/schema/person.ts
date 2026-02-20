export class Person {
  personId: number;

  publicId: string;

  name: string;

  document: string;

  birthDate: Date;

  status: number = 1;

  deletedAt?: Date;
}
