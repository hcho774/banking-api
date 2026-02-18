import { Person } from './person';
import { Transaction } from './transaction';

export class AccountRelations {
  person: Person;

  transactions: Transaction[];
}
