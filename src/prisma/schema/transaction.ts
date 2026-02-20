export class Transaction {
  transactionId: string;

  accountId: string;

  value: number;

  transactionDate: Date;

  idempotencyKey: string;

  type: number;
}
