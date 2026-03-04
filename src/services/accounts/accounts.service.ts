import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { StatementQueryDto } from './dto/statement-query.dto';
import { parsePagination } from 'src/common/utils/pagination.util';
import { getStartOfDay } from 'src/common/utils/date.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { PersonStatus } from 'src/common/enums/person-status.enum';
import { TransactionType } from 'src/common/enums/transaction-type.enum';
import { TRANSACTION_OPTIONS } from 'src/common/constants/transaction.constants';
import { Account, Prisma, Transaction } from 'src/prisma/prismaClient';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findActiveAccount(accountId: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { accountId, activeFlag: true },
    });
    if (!account) {
      throw new NotFoundException(
        `Active account with id ${accountId} not found`,
      );
    }
    return account;
  }

  private async checkIdempotency(idempotencyKey: string): Promise<void> {
    const existing = await this.prisma.transaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      throw new ConflictException('Transaction has been already completed.');
    }
  }

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const { personPublicId, ...accountData } = createAccountDto;

    const person = await this.prisma.person.findUnique({
      where: { publicId: personPublicId, status: PersonStatus.ACTIVE },
    });
    if (!person) {
      throw new NotFoundException(
        `Active person with publicId ${personPublicId} not found`,
      );
    }

    const account = await this.prisma.account.create({
      data: {
        ...accountData,
        personId: person.personId,
      },
    });
    return account;
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Account>> {
    const { page, limit, skip } = parsePagination(query);
    const where = { activeFlag: true };

    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({ where, skip, take: limit }),
      this.prisma.account.count({ where }),
    ]);

    return {
      items: accounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(accountId: string): Promise<Account> {
    return this.findActiveAccount(accountId);
  }

  async update(
    accountId: string,
    updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    await this.findActiveAccount(accountId);

    const account = await this.prisma.account.update({
      where: { accountId },
      data: updateAccountDto,
    });

    return account;
  }

  async blockAccount(accountId: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { accountId },
    });
    if (!account) {
      throw new NotFoundException(`Account with id ${accountId} not found`);
    }
    if (!account.activeFlag) {
      throw new ConflictException('Account is already blocked.');
    }

    return this.prisma.account.update({
      where: { accountId },
      data: { activeFlag: false },
    });
  }

  async getBalance(
    accountId: string,
  ): Promise<{ accountId: string; balance: number }> {
    const account = await this.findActiveAccount(accountId);

    return { accountId: account.accountId, balance: account.balance };
  }

  async deposit(accountId: string, depositDto: DepositDto): Promise<Account> {
    await this.findActiveAccount(accountId);
    await this.checkIdempotency(depositDto.idempotencyKey);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            accountId,
            value: depositDto.amount,
            type: TransactionType.DEPOSIT,
            idempotencyKey: depositDto.idempotencyKey,
          },
        });

        const account = await tx.account.update({
          where: { accountId },
          data: { balance: { increment: depositDto.amount } },
        });

        return account;
      }, TRANSACTION_OPTIONS);

      return result;
    } catch (e) {
      if (e.code === 'P2002') {
        throw new ConflictException('Transaction has been already completed.');
      }
      throw e;
    }
  }

  async withdraw(
    accountId: string,
    withdrawDto: WithdrawDto,
  ): Promise<Account> {
    await this.findActiveAccount(accountId);
    await this.checkIdempotency(withdrawDto.idempotencyKey);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const [locked] = await tx.$queryRaw<Account[]>`
          SELECT * FROM "accounts"
          WHERE "accountId" = ${accountId}
          FOR UPDATE
        `;

        if (locked.balance < withdrawDto.amount) {
          throw new BadRequestException('Insufficient balance.');
        }

        const startOfDay = getStartOfDay();

        const todayWithdrawals = await tx.transaction.aggregate({
          where: {
            accountId,
            type: TransactionType.WITHDRAWAL,
            transactionDate: { gte: startOfDay },
          },
          _sum: { value: true },
        });

        const todayTotal = todayWithdrawals._sum.value ?? 0;
        if (todayTotal + withdrawDto.amount > locked.dailyWithdrawalLimit) {
          throw new BadRequestException(
            `Daily withdrawal limit exceeded. Limit: ${locked.dailyWithdrawalLimit}, already withdrawn today: ${todayTotal}, requested: ${withdrawDto.amount}.`,
          );
        }

        await tx.transaction.create({
          data: {
            accountId,
            value: withdrawDto.amount,
            type: TransactionType.WITHDRAWAL,
            idempotencyKey: withdrawDto.idempotencyKey,
          },
        });

        const account = await tx.account.update({
          where: { accountId },
          data: { balance: { decrement: withdrawDto.amount } },
        });

        return account;
      }, TRANSACTION_OPTIONS);

      return result;
    } catch (e) {
      if (e.code === 'P2002') {
        throw new ConflictException('Transaction has been already completed.');
      }
      throw e;
    }
  }

  async transfer(
    sourceAccountId: string,
    transferDto: TransferDto,
  ): Promise<{ sourceAccount: Account; targetAccount: Account }> {
    const { targetAccountId, amount, idempotencyKey } = transferDto;

    if (sourceAccountId === targetAccountId) {
      throw new BadRequestException('Cannot transfer to the same account.');
    }

    await this.findActiveAccount(sourceAccountId);
    await this.findActiveAccount(targetAccountId);
    await this.checkIdempotency(idempotencyKey);

    const [firstId, secondId] =
      sourceAccountId < targetAccountId
        ? [sourceAccountId, targetAccountId]
        : [targetAccountId, sourceAccountId];

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const [first] = await tx.$queryRaw<Account[]>`
          SELECT * FROM "accounts"
          WHERE "accountId" = ${firstId}
          FOR UPDATE
        `;
        const [second] = await tx.$queryRaw<Account[]>`
          SELECT * FROM "accounts"
          WHERE "accountId" = ${secondId}
          FOR UPDATE
        `;

        const source = firstId === sourceAccountId ? first : second;

        if (source.balance < amount) {
          throw new BadRequestException('Insufficient balance.');
        }

        const startOfDay = getStartOfDay();
        const todayWithdrawals = await tx.transaction.aggregate({
          where: {
            accountId: sourceAccountId,
            type: {
              in: [TransactionType.WITHDRAWAL, TransactionType.TRANSFER],
            },
            transactionDate: { gte: startOfDay },
          },
          _sum: { value: true },
        });

        const todayTotal = todayWithdrawals._sum.value ?? 0;
        if (todayTotal + amount > source.dailyWithdrawalLimit) {
          throw new BadRequestException(
            `Daily withdrawal limit exceeded. Limit: ${source.dailyWithdrawalLimit}, already withdrawn today: ${todayTotal}, requested: ${amount}.`,
          );
        }

        await tx.transaction.createMany({
          data: [
            {
              accountId: sourceAccountId,
              value: amount,
              type: TransactionType.TRANSFER,
              idempotencyKey,
            },
            {
              accountId: targetAccountId,
              value: amount,
              type: TransactionType.TRANSFER,
              idempotencyKey: `${idempotencyKey}-credit`,
            },
          ],
        });

        const sourceAccount = await tx.account.update({
          where: { accountId: sourceAccountId },
          data: { balance: { decrement: amount } },
        });

        const targetAccount = await tx.account.update({
          where: { accountId: targetAccountId },
          data: { balance: { increment: amount } },
        });

        return { sourceAccount, targetAccount };
      }, TRANSACTION_OPTIONS);

      return result;
    } catch (e) {
      if (e.code === 'P2002') {
        throw new ConflictException('Transaction has been already completed.');
      }
      throw e;
    }
  }

  async getStatements(
    accountId: string,
    query: StatementQueryDto,
  ): Promise<PaginatedResult<Transaction>> {
    const { page, limit, skip } = parsePagination(query);

    await this.findActiveAccount(accountId);

    const where: Prisma.TransactionWhereInput = { accountId };
    if (query.fromDate || query.toDate) {
      where.transactionDate = {};
      if (query.fromDate) where.transactionDate.gte = query.fromDate;
      if (query.toDate) where.transactionDate.lte = query.toDate;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
