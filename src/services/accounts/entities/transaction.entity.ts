import { Transaction as PrismaTransaction } from '../../../prisma/schema/transaction';

export class TransactionEntity implements PrismaTransaction {
  transactionId: string;
  accountId: string;
  value: number;
  transactionDate: Date;
  idempotencyKey: string;
  type: number;
}
