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
