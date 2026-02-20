import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PersonStatus } from 'src/common/enums/person-status.enum';
import { TransactionType } from 'src/common/enums/transaction-type.enum';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findActiveAccount(accountId: string) {
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

  async create(createAccountDto: CreateAccountDto) {
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

  async deposit(accountId: string, depositDto: DepositDto) {
    await this.findActiveAccount(accountId);

    const existing = await this.prisma.transaction.findUnique({
      where: { idempotencyKey: depositDto.idempotencyKey },
    });
    if (existing) {
      throw new ConflictException(`Transaction has been already completed.`);
    }

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
      });

      return result;
    } catch (e) {
      if (e.code === 'P2002') {
        throw new ConflictException('Transaction has been already completed.');
      }
      throw e;
    }
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
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

  async findOne(accountId: string) {
    return this.findActiveAccount(accountId);
  }

  async update(accountId: string, updateAccountDto: UpdateAccountDto) {
    await this.findActiveAccount(accountId);
    const account = await this.prisma.account.update({
      where: { accountId },
      data: updateAccountDto,
    });
    return account;
  }
}
