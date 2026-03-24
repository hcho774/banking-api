import { Account as PrismaAccount } from '../../../prisma/schema/account';

export class AccountEntity implements PrismaAccount {
  accountId: string;
  personId: number;
  balance: number;
  dailyWithdrawalLimit: number;
  activeFlag: boolean = true;
  accountType: number;
  createDate: Date;
}
