export enum TransactionType {
  DEPOSIT = 1,
  WITHDRAWAL = 2,
}

export const TransactionTypeLabel: Record<TransactionType, string> = {
  [TransactionType.DEPOSIT]: 'DEPOSIT',
  [TransactionType.WITHDRAWAL]: 'WITHDRAWAL',
};
