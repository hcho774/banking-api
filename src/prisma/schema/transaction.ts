export class Transaction {
  transactionId: number;

  accountId: number;

  value: number;

  transactionDate: Date;

  idempotencyKey?: string;

  type: number;
}
