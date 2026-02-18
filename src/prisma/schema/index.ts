import { AccountRelations as _AccountRelations } from './account_relations';
import { PersonRelations as _PersonRelations } from './person_relations';
import { TransactionRelations as _TransactionRelations } from './transaction_relations';
import { Account as _Account } from './account';
import { Person as _Person } from './person';
import { Transaction as _Transaction } from './transaction';

export namespace PrismaModel {
  export class AccountRelations extends _AccountRelations {}
  export class PersonRelations extends _PersonRelations {}
  export class TransactionRelations extends _TransactionRelations {}
  export class Account extends _Account {}
  export class Person extends _Person {}
  export class Transaction extends _Transaction {}

  export const extraModels = [
    AccountRelations,
    PersonRelations,
    TransactionRelations,
    Account,
    Person,
    Transaction,
  ];
}
