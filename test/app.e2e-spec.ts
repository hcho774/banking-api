import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Banking API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const API_KEY = process.env.API_KEY || 'scret-key';

  // Shared state across ordered tests
  let personPublicId: string;
  let accountId: string;
  let secondAccountId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    await app.init();

    prisma = app.get(PrismaService);

    // Clean slate
    await prisma.transaction.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.person.deleteMany({});
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.person.deleteMany({});
    await app.close();
  });

  // ════════════════════════════════════════════════════════════════════
  //  HEALTH
  // ════════════════════════════════════════════════════════════════════

  describe('Health', () => {
    it('GET /health — should return ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          // Terminus response wrapped by TransformInterceptor
          expect(res.body.success).toBe(true);
        });
    });
  });

  // ════════════════════════════════════════════════════════════════════
  //  AUTH
  // ════════════════════════════════════════════════════════════════════

  describe('Auth', () => {
    it('should return 401 without API key', () => {
      return request(app.getHttpServer()).get('/api/persons').expect(401);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  //  PERSONS
  // ════════════════════════════════════════════════════════════════════

  describe('Persons', () => {
    it('POST /api/persons — should create a person', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/persons')
        .set('apiKey', API_KEY)
        .send({
          name: 'E2E Test Person',
          document: 'e2e-doc-001',
          birthDate: '1990-01-15',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.publicId).toBeDefined();
      expect(res.body.data.name).toBe('E2E Test Person');
      personPublicId = res.body.data.publicId;
    });

    it('POST /api/persons — should reject invalid body', () => {
      return request(app.getHttpServer())
        .post('/api/persons')
        .set('apiKey', API_KEY)
        .send({ name: '' })
        .expect(400);
    });

    it('GET /api/persons — should list persons', () => {
      return request(app.getHttpServer())
        .get('/api/persons')
        .set('apiKey', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          expect(res.body.meta).toBeDefined();
        });
    });

    it('GET /api/persons/:publicId — should get one person', () => {
      return request(app.getHttpServer())
        .get(`/api/persons/${personPublicId}`)
        .set('apiKey', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.publicId).toBe(personPublicId);
        });
    });

    it('PATCH /api/persons/:publicId — should update person', () => {
      return request(app.getHttpServer())
        .patch(`/api/persons/${personPublicId}`)
        .set('apiKey', API_KEY)
        .send({ name: 'Updated E2E Person' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.name).toBe('Updated E2E Person');
        });
    });

    it('DELETE /api/persons/:publicId — should soft delete', () => {
      return request(app.getHttpServer())
        .delete(`/api/persons/${personPublicId}`)
        .set('apiKey', API_KEY)
        .expect(200);
    });

    it('GET /api/persons/:publicId — deleted person should not be found', () => {
      return request(app.getHttpServer())
        .get(`/api/persons/${personPublicId}`)
        .set('apiKey', API_KEY)
        .expect(404);
    });

    it('PATCH /api/persons/:publicId/reactivate — should reactivate', () => {
      return request(app.getHttpServer())
        .patch(`/api/persons/${personPublicId}/reactivate`)
        .set('apiKey', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  // ════════════════════════════════════════════════════════════════════
  //  ACCOUNTS
  // ════════════════════════════════════════════════════════════════════

  describe('Accounts', () => {
    it('POST /api/accounts — should create an account', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/accounts')
        .set('apiKey', API_KEY)
        .send({
          personPublicId,
          dailyWithdrawalLimit: 5000,
          accountType: 1,
          balance: 0,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accountId).toBeDefined();
      accountId = res.body.data.accountId;
    });

    it('POST /api/accounts — should reject for nonexistent person', () => {
      return request(app.getHttpServer())
        .post('/api/accounts')
        .set('apiKey', API_KEY)
        .send({
          personPublicId: '00000000-0000-0000-0000-000000000000',
          dailyWithdrawalLimit: 1000,
          accountType: 1,
        })
        .expect(404);
    });

    it('GET /api/accounts — should list accounts', () => {
      return request(app.getHttpServer())
        .get('/api/accounts')
        .set('apiKey', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          expect(res.body.meta).toBeDefined();
        });
    });

    it('GET /api/accounts/:accountId — should return account detail', () => {
      return request(app.getHttpServer())
        .get(`/api/accounts/${accountId}`)
        .set('apiKey', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.accountId).toBe(accountId);
        });
    });

    it('GET /api/accounts/:accountId/balance — should return 0 balance', () => {
      return request(app.getHttpServer())
        .get(`/api/accounts/${accountId}/balance`)
        .set('apiKey', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.balance).toBe(0);
        });
    });

    // ── Deposit ─────────────────────────────────────────────────────

    it('POST /api/accounts/:accountId/deposit — should deposit funds', () => {
      return request(app.getHttpServer())
        .post(`/api/accounts/${accountId}/deposit`)
        .set('apiKey', API_KEY)
        .send({ amount: 10000, idempotencyKey: 'e2e-deposit-1' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.balance).toBe(10000);
        });
    });

    it('POST /api/accounts/:accountId/deposit — duplicate idempotency key → 409', () => {
      return request(app.getHttpServer())
        .post(`/api/accounts/${accountId}/deposit`)
        .set('apiKey', API_KEY)
        .send({ amount: 5000, idempotencyKey: 'e2e-deposit-1' })
        .expect(409);
    });

    // ── Withdraw ────────────────────────────────────────────────────

    it('POST /api/accounts/:accountId/withdraw — should withdraw funds', () => {
      return request(app.getHttpServer())
        .post(`/api/accounts/${accountId}/withdraw`)
        .set('apiKey', API_KEY)
        .send({ amount: 2000, idempotencyKey: 'e2e-withdraw-1' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.balance).toBe(8000);
        });
    });

    it('POST /api/accounts/:accountId/withdraw — insufficient balance → 400', () => {
      return request(app.getHttpServer())
        .post(`/api/accounts/${accountId}/withdraw`)
        .set('apiKey', API_KEY)
        .send({ amount: 999999, idempotencyKey: 'e2e-withdraw-huge' })
        .expect(400);
    });

    it('POST /api/accounts/:accountId/withdraw — daily limit exceeded → 400', () => {
      return request(app.getHttpServer())
        .post(`/api/accounts/${accountId}/withdraw`)
        .set('apiKey', API_KEY)
        .send({ amount: 4000, idempotencyKey: 'e2e-withdraw-limit' })
        .expect(400);
    });

    it('POST /api/accounts/:accountId/withdraw — should prevent race conditions on double withdrawal', async () => {
      // Send two completely independent withdrawal requests simultaneously for a tiny amount (10)
      const amountToWithdraw = 10;
      
      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/accounts/${accountId}/withdraw`)
          .set('apiKey', API_KEY)
          .send({ amount: amountToWithdraw, idempotencyKey: 'race-test-key-1' }),
        request(app.getHttpServer())
          .post(`/api/accounts/${accountId}/withdraw`)
          .set('apiKey', API_KEY)
          .send({ amount: amountToWithdraw, idempotencyKey: 'race-test-key-2' }),
      ]);

      const statuses = [response1.status, response2.status].sort();
      
      // Since balance is 8000 and amount is 10, both have enough balance, but because
      // of the pessimistic lock, they process sequentially. So BOTH succeed (201).
      // We are just verifying that they don't crash into a 500 Server Error deadlock.
      expect(statuses).toEqual([201, 201]);

      const finalBalanceRes = await request(app.getHttpServer())
        .get(`/api/accounts/${accountId}/balance`)
        .set('apiKey', API_KEY);
      
      // 8000 - 10 - 10 = 7980
      expect(finalBalanceRes.body.data.balance).toBe(7980);
    });

    // ── Transfer ─────────────────────────────────────────────────────

    it('POST /api/accounts — should create a second account for transfer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/accounts')
        .set('apiKey', API_KEY)
        .send({
          personPublicId,
          dailyWithdrawalLimit: 10000,
          accountType: 1,
          balance: 0,
        })
        .expect(201);

      secondAccountId = res.body.data.accountId;
    });

    it('POST /api/accounts/:accountId/transfer — should transfer funds', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/accounts/${accountId}/transfer`)
        .set('apiKey', API_KEY)
        .send({
          targetAccountId: secondAccountId,
          amount: 2900,
          idempotencyKey: 'e2e-transfer-1', // Changing amount to 2900 so daily limit (5000) isn't hit
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      // 7980 - 2900 = 5080
      expect(res.body.data.sourceAccount.balance).toBe(5080); 
      expect(res.body.data.targetAccount.balance).toBe(2900); 
    });

    it('POST /api/accounts/:accountId/transfer — same account → 400', () => {
      return request(app.getHttpServer())
        .post(`/api/accounts/${accountId}/transfer`)
        .set('apiKey', API_KEY)
        .send({
          targetAccountId: accountId,
          amount: 1000,
          idempotencyKey: 'e2e-transfer-self',
        })
        .expect(400);
    });

    it('POST /api/accounts/:accountId/transfer — insufficient balance → 400', () => {
      return request(app.getHttpServer())
        .post(`/api/accounts/${accountId}/transfer`)
        .set('apiKey', API_KEY)
        .send({
          targetAccountId: secondAccountId,
          amount: 999999,
          idempotencyKey: 'e2e-transfer-huge',
        })
        .expect(400);
    });

    it('POST /api/accounts/:accountId/transfer — duplicate idempotency → 409', () => {
      return request(app.getHttpServer())
        .post(`/api/accounts/${accountId}/transfer`)
        .set('apiKey', API_KEY)
        .send({
          targetAccountId: secondAccountId,
          amount: 100,
          idempotencyKey: 'e2e-transfer-1',
        })
        .expect(409);
    });

    it('POST /api/accounts/:accountId/transfer — should prevent race conditions on double transfer', async () => {
      // Current balances:
      // source = 5080, target = 2900 
      // We transfer 10 simultaneously twice to not hit limits.
      const amountToTransfer = 10;
      
      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/accounts/${accountId}/transfer`)
          .set('apiKey', API_KEY)
          .send({ targetAccountId: secondAccountId, amount: amountToTransfer, idempotencyKey: 'race-transfer-key-1' }),
        request(app.getHttpServer())
          .post(`/api/accounts/${accountId}/transfer`)
          .set('apiKey', API_KEY)
          .send({ targetAccountId: secondAccountId, amount: amountToTransfer, idempotencyKey: 'race-transfer-key-2' }),
      ]);

      const statuses = [response1.status, response2.status].sort();
      
      // Because of the SELECT FOR UPDATE pessimistic lock on multiple tables,
      // they should process in sequence. Both should succeed because there's plenty of balance.
      expect(statuses).toEqual([201, 201]);

      // Verify the final balances
      // source: 5080 - 10 - 10 = 5060
      // target: 2900 + 10 + 10 = 2920
      const sourceBalanceRes = await request(app.getHttpServer())
        .get(`/api/accounts/${accountId}/balance`)
        .set('apiKey', API_KEY);
      expect(sourceBalanceRes.body.data.balance).toBe(5060);

      const targetBalanceRes = await request(app.getHttpServer())
        .get(`/api/accounts/${secondAccountId}/balance`)
        .set('apiKey', API_KEY);
      expect(targetBalanceRes.body.data.balance).toBe(2920);
    });

    // ── Statements ──────────────────────────────────────────────────

    it('GET /api/accounts/:accountId/statements — should return transactions', () => {
      return request(app.getHttpServer())
        .get(`/api/accounts/${accountId}/statements`)
        .set('apiKey', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);
          expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
        });
    });

    // ── Block ───────────────────────────────────────────────────────

    it('PATCH /api/accounts/:accountId/block — should block account', () => {
      return request(app.getHttpServer())
        .patch(`/api/accounts/${accountId}/block`)
        .set('apiKey', API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.activeFlag).toBe(false);
        });
    });

    it('PATCH /api/accounts/:accountId/block — already blocked → 409', () => {
      return request(app.getHttpServer())
        .patch(`/api/accounts/${accountId}/block`)
        .set('apiKey', API_KEY)
        .expect(409);
    });

    it('POST /api/accounts/:accountId/deposit — blocked account → 404', () => {
      return request(app.getHttpServer())
        .post(`/api/accounts/${accountId}/deposit`)
        .set('apiKey', API_KEY)
        .send({ amount: 100, idempotencyKey: 'e2e-blocked-deposit' })
        .expect(404);
    });
  });
});
