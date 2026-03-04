import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PersonStatus } from 'src/common/enums/person-status.enum';

const mockAccount = {
  accountId: 'acc-uuid-1',
  personId: 1,
  balance: 10000,
  dailyWithdrawalLimit: 5000,
  activeFlag: true,
  accountType: 1,
  createDate: new Date(),
};

const mockTransaction = {
  transactionId: 'tx-uuid-1',
  accountId: 'acc-uuid-1',
  value: 1000,
  transactionDate: new Date(),
  idempotencyKey: 'idem-key-1',
  type: 1,
};

const mockPrisma = {
  person: {
    findUnique: jest.fn(),
  },
  account: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  transaction: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
};

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  // ─── create ────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create an account for an active person', async () => {
      prisma.person.findUnique.mockResolvedValue({
        personId: 1,
        publicId: 'person-uuid',
        status: PersonStatus.ACTIVE,
      });
      prisma.account.create.mockResolvedValue(mockAccount);

      const result = await service.create({
        personPublicId: 'person-uuid',
        balance: 10000,
        dailyWithdrawalLimit: 5000,
        accountType: 1,
      });

      expect(result).toEqual(mockAccount);
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          balance: 10000,
          dailyWithdrawalLimit: 5000,
          accountType: 1,
          personId: 1,
        },
      });
    });

    it('should throw NotFoundException if person does not exist', async () => {
      prisma.person.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          personPublicId: 'nonexistent',
          balance: 0,
          dailyWithdrawalLimit: 1000,
          accountType: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAll ───────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated active accounts', async () => {
      prisma.account.findMany.mockResolvedValue([mockAccount]);
      prisma.account.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return an active account', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.findOne('acc-uuid-1');

      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException for inactive account', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── update ────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update account details', async () => {
      const updated = { ...mockAccount, dailyWithdrawalLimit: 8000 };
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.account.update.mockResolvedValue(updated);

      const result = await service.update('acc-uuid-1', {
        dailyWithdrawalLimit: 8000,
      });

      expect(result.dailyWithdrawalLimit).toBe(8000);
    });
  });

  // ─── blockAccount ─────────────────────────────────────────────────

  describe('blockAccount', () => {
    it('should block an active account', async () => {
      const blocked = { ...mockAccount, activeFlag: false };
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.account.update.mockResolvedValue(blocked);

      const result = await service.blockAccount('acc-uuid-1');

      expect(result.activeFlag).toBe(false);
    });

    it('should throw NotFoundException if account not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.blockAccount('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if already blocked', async () => {
      prisma.account.findUnique.mockResolvedValue({
        ...mockAccount,
        activeFlag: false,
      });

      await expect(service.blockAccount('acc-uuid-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── getBalance ───────────────────────────────────────────────────

  describe('getBalance', () => {
    it('should return accountId and balance', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.getBalance('acc-uuid-1');

      expect(result).toEqual({ accountId: 'acc-uuid-1', balance: 10000 });
    });
  });

  // ─── deposit ──────────────────────────────────────────────────────

  describe('deposit', () => {
    it('should deposit and return updated account', async () => {
      const deposited = { ...mockAccount, balance: 11000 };
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue(deposited);

      const result = await service.deposit('acc-uuid-1', {
        amount: 1000,
        idempotencyKey: 'idem-new',
      });

      expect(result.balance).toBe(11000);
    });

    it('should throw ConflictException for duplicate idempotency key', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

      await expect(
        service.deposit('acc-uuid-1', {
          amount: 1000,
          idempotencyKey: 'idem-key-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on P2002 (db-level duplicate)', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.transaction.findUnique.mockResolvedValue(null);
      const p2002Error = new Error('Unique constraint');
      (p2002Error as unknown as { code: string }).code = 'P2002';
      prisma.$transaction.mockRejectedValue(p2002Error);

      await expect(
        service.deposit('acc-uuid-1', {
          amount: 1000,
          idempotencyKey: 'race-key',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for inactive account', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(
        service.deposit('nonexistent', {
          amount: 1000,
          idempotencyKey: 'idem-new',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── withdraw ─────────────────────────────────────────────────────

  describe('withdraw', () => {
    it('should withdraw and return updated account', async () => {
      const withdrawn = { ...mockAccount, balance: 9000 };
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue(withdrawn);

      const result = await service.withdraw('acc-uuid-1', {
        amount: 1000,
        idempotencyKey: 'idem-wd',
      });

      expect(result.balance).toBe(9000);
    });

    it('should throw ConflictException for duplicate idempotency key', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

      await expect(
        service.withdraw('acc-uuid-1', {
          amount: 1000,
          idempotencyKey: 'idem-key-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on P2002 error', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.transaction.findUnique.mockResolvedValue(null);
      const p2002Error = new Error('Unique constraint');
      (p2002Error as unknown as { code: string }).code = 'P2002';
      prisma.$transaction.mockRejectedValue(p2002Error);

      await expect(
        service.withdraw('acc-uuid-1', {
          amount: 1000,
          idempotencyKey: 'race-key',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should re-throw non-P2002 errors', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockRejectedValue(new Error('DB crash'));

      await expect(
        service.withdraw('acc-uuid-1', {
          amount: 1000,
          idempotencyKey: 'idem-new',
        }),
      ).rejects.toThrow('DB crash');
    });
  });

  // ─── transfer ──────────────────────────────────────────────────────

  describe('transfer', () => {
    const sourceAccount = {
      ...mockAccount,
      accountId: 'source-1',
      balance: 10000,
    };
    const targetAccount = {
      ...mockAccount,
      accountId: 'target-1',
      balance: 5000,
    };

    it('should throw BadRequestException if source and target are the same', async () => {
      await expect(
        service.transfer('source-1', {
          targetAccountId: 'source-1',
          amount: 1000,
          idempotencyKey: 'idem-transfer-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if a source or target account is inactive', async () => {
      prisma.account.findUnique.mockResolvedValueOnce(sourceAccount);
      prisma.account.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.transfer('source-1', {
          targetAccountId: 'nonexistent-1',
          amount: 1000,
          idempotencyKey: 'idem-transfer-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if idempotency key already exists', async () => {
      prisma.account.findUnique.mockResolvedValueOnce(sourceAccount);
      prisma.account.findUnique.mockResolvedValueOnce(targetAccount);
      prisma.transaction.findUnique.mockResolvedValue(mockTransaction);

      await expect(
        service.transfer('source-1', {
          targetAccountId: 'target-1',
          amount: 1000,
          idempotencyKey: 'idem-existing-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully transfer funds between two accounts', async () => {
      prisma.account.findUnique.mockResolvedValueOnce(sourceAccount);
      prisma.account.findUnique.mockResolvedValueOnce(targetAccount);
      prisma.transaction.findUnique.mockResolvedValue(null);

      const updatedSource = { ...sourceAccount, balance: 9000 };
      const updatedTarget = { ...targetAccount, balance: 6000 };

      prisma.$transaction.mockResolvedValue({
        sourceAccount: updatedSource,
        targetAccount: updatedTarget,
      });

      const result = await service.transfer('source-1', {
        targetAccountId: 'target-1',
        amount: 1000,
        idempotencyKey: 'idem-transfer-ok',
      });

      expect(result.sourceAccount.balance).toBe(9000);
      expect(result.targetAccount.balance).toBe(6000);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  // ─── getStatements ────────────────────────────────────────────────

  describe('getStatements', () => {
    it('should return paginated statements', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.transaction.findMany.mockResolvedValue([mockTransaction]);
      prisma.transaction.count.mockResolvedValue(1);

      const result = await service.getStatements('acc-uuid-1', {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should apply date filters when provided', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      const fromDate = new Date('2026-02-01');
      const toDate = new Date('2026-02-28');

      await service.getStatements('acc-uuid-1', {
        page: 1,
        limit: 10,
        fromDate,
        toDate,
      });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            accountId: 'acc-uuid-1',
            transactionDate: { gte: fromDate, lte: toDate },
          },
        }),
      );
    });

    it('should throw NotFoundException for inactive account', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(
        service.getStatements('nonexistent', { page: 1, limit: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
