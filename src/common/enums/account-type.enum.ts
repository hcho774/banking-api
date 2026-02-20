export enum AccountType {
  CHECKING = 1,
  SAVINGS = 2,
}

export const AccountTypeLabel: Record<AccountType, string> = {
  [AccountType.CHECKING]: 'CHECKING',
  [AccountType.SAVINGS]: 'SAVINGS',
};
