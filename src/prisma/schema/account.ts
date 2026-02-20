export class Account {
  accountId: string;

  personId: number;

  balance: number;

  dailyWithdrawalLimit: number;

  activeFlag: boolean = true;

  accountType: number;

  createDate: Date;
}
