import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { DepositDto } from './dto/deposit.dto';
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

  findAll() {
    return `This action returns all accounts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} account`;
  }

  update(id: number, updateAccountDto: UpdateAccountDto) {
    return `This action updates a #${id} account`;
  }

  remove(id: number) {
    return `This action removes a #${id} account`;
  }
}
