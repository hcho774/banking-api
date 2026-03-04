# Banking API

A production-grade RESTful Banking API built with NestJS, TypeScript, Prisma, and PostgreSQL. Features full account lifecycle management, secure financial transactions with idempotency guarantees, and comprehensive failure resilience patterns.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Design](#architecture-design)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Implementation Statement by Period](#implementation-statement-by-period)
- [Testing](#testing)

---

## Tech Stack

| Layer            | Technology                         | Version     |
| ---------------- | ---------------------------------- | ----------- |
| Runtime          | Node.js                            | 20.x        |
| Language         | TypeScript                         | 5.7         |
| Framework        | NestJS                             | 11.x        |
| Database         | PostgreSQL                         | 15 (Alpine) |
| ORM              | Prisma                             | 6.19        |
| Authentication   | API Key (Passport)                 | —           |
| Documentation    | Swagger (OpenAPI 3.0)              | —           |
| Logging          | Pino                               | —           |
| Security         | Helmet, CORS, Throttler            | —           |
| Containerization | Docker Compose                     | 3.8         |
| Validation       | class-validator, class-transformer | —           |

---

## Project Structure

```
banking-api/
├── prisma/
│   ├── migrations/          # Database migration history
│   ├── schema.prisma        # Prisma schema definition
│   └── seed.ts              # Database seed (sample person + account)
├── src/
│   ├── common/
│   │   ├── constants/       # Shared constants (transaction options)
│   │   ├── decorators/      # Custom decorators (@Mask)
│   │   ├── dto/             # Shared DTOs (PaginationQueryDto)
│   │   ├── enums/           # Enums (PersonStatus, AccountType, TransactionType)
│   │   ├── filters/         # GlobalExceptionFilter
│   │   ├── guards/          # ApiKeyGuard
│   │   ├── interceptors/    # SerializeInterceptor, TransformInterceptor
│   │   ├── interfaces/      # PaginatedResult<T>
│   │   └── utils/           # Utilities (parsePagination, getStartOfDay)
│   ├── health/              # Health check endpoint (/health)
│   ├── prisma/              # PrismaService, PrismaModule, generated client
│   ├── services/
│   │   ├── accounts/        # Account module (controller, service, DTOs, entities)
│   │   ├── auth/            # Authentication module (API Key strategy)
│   │   └── persons/         # Person module (controller, service, DTOs, entities)
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application bootstrap
├── test/
│   ├── app.e2e-spec.ts      # E2E test suite (22 cases)
│   └── jest-e2e.json        # E2E Jest configuration
├── Dockerfile               # Multi-stage production build
├── .dockerignore             # Docker build context filter
├── docker-compose.yml       # PostgreSQL + API containers
└── .env.example             # Environment variable template
```

---

## Architecture Design

### Layered Architecture

The application follows a clean **layered architecture** pattern, ensuring separation of concerns and testability:

```mermaid
graph TB
    Client([HTTP Client])

    subgraph "Security Layer"
        Helmet[Helmet]
        CORS[CORS]
        Throttle[Rate Limiter]
        ApiKey[API Key Guard]
    end

    subgraph "Application Layer"
        Controller[Controllers]
        Validation[ValidationPipe]
        Serialize[SerializeInterceptor]
        Transform[TransformInterceptor]
        ExFilter[GlobalExceptionFilter]
    end

    subgraph "Business Layer"
        PersonSvc[PersonsService]
        AccountSvc[AccountsService]
    end

    subgraph "Data Layer"
        Prisma[PrismaService]
        DB[(PostgreSQL)]
    end

    Client --> Helmet --> CORS --> Throttle --> ApiKey
    ApiKey --> Controller
    Controller --> Validation --> Serialize
    Controller --> PersonSvc
    Controller --> AccountSvc
    PersonSvc --> Prisma
    AccountSvc --> Prisma
    Prisma --> DB
    ExFilter -.-> Controller
    Transform -.-> Controller
```

### Entity Relationship Diagram

```mermaid
erDiagram
    Person ||--o{ Account : "has many"
    Account ||--o{ Transaction : "has many"

    Person {
        int personId PK
        string publicId UK
        string name
        string document UK
        datetime birthDate
        int status
        datetime deletedAt
    }

    Account {
        string accountId PK
        int personId FK
        int balance
        int dailyWithdrawalLimit
        boolean activeFlag
        int accountType
        datetime createDate
    }

    Transaction {
        string transactionId PK
        string accountId FK
        int value
        datetime transactionDate
        string idempotencyKey UK
        int type
    }
```

### Key Design Decisions

| Decision                    | Rationale                                                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DTO ↔ Entity separation** | DTOs handle validation (input) and serialization (output), while Entities map to database schema. The `@Serialize` decorator auto-transforms responses.                                 |
| **Idempotency Key**         | Every deposit/withdrawal/transfer requires a unique `idempotencyKey` to prevent duplicate transactions caused by network retries or client errors.                                      |
| **SELECT FOR UPDATE**       | Withdrawal and transfer operations use pessimistic locking (`SELECT FOR UPDATE`) within Prisma interactive transactions to prevent race conditions on concurrent balance modifications. |
| **Deadlock Prevention**     | Transfers lock both accounts in sorted UUID order to prevent deadlocks when concurrent A→B and B→A transfers occur simultaneously.                                                      |
| **Soft Delete**             | Persons use a `status` field (ACTIVE=1, INACTIVE=2, DELETED=3) instead of hard deletion, preserving referential integrity and audit trails.                                             |
| **UUID Primary Keys**       | Accounts and Transactions use UUIDs for IDs, preventing enumeration attacks and enabling distributed ID generation.                                                                     |
| **Global Exception Filter** | All exceptions (HTTP, Prisma, unknown) are caught and transformed into a consistent JSON error response format with request tracing.                                                    |

---

## Getting Started

### Prerequisites

| Tool                    | Version |
| ----------------------- | ------- |
| Node.js                 | ≥ 20.x  |
| npm                     | ≥ 9.x   |
| Docker & Docker Compose | Latest  |

### 1. Clone the Repository

```bash
git clone <repository-url>
cd banking-api
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

| Variable          | Description                                      | Default                                                                  |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| `DATABASE_URL`    | PostgreSQL connection string                     | `postgresql://postgres:password@localhost:5432/banking_db?schema=public` |
| `NODE_ENV`        | Environment (development / production)           | `development`                                                            |
| `PORT`            | Server port                                      | `3000`                                                                   |
| `API_KEY`         | API authentication key (sent in `apiKey` header) | —                                                                        |
| `THROTTLE_TTL`    | Rate limit time window in seconds                | `60`                                                                     |
| `THROTTLE_LIMIT`  | Max requests per time window                     | `30`                                                                     |
| `SWAGGER_ENABLED` | Enable Swagger UI at `/docs` (`true` / `false`)  | `false`                                                                  |

### 3. Quick Start with Docker (Recommended)

Start everything with a single command — PostgreSQL, migrations, seed data, and API server:

```bash
docker compose up --build
```

The API will be available at `http://localhost:3000`. A sample person and account are automatically seeded (see output for IDs).

#### Authentication

All API endpoints (except `/health`) require the `apiKey` header. Use the value set in `docker-compose.yml`:

```bash
curl http://localhost:3000/api/persons \
  -H "apiKey: secret-key"
```

> **Without the `apiKey` header**, requests will return `401 Unauthorized`.

#### Swagger Documentation

When `SWAGGER_ENABLED` is set to `'true'` (default in `docker-compose.yml`), interactive API docs are available at:

```
http://localhost:3000/docs
```

Click the **Authorize** button in Swagger UI and enter your API key to authenticate all requests.

#### Stopping

```bash
docker compose down        # keep data
docker compose down -v     # reset data
```

> Skip to [Quick Start Example](#9-quick-start-example) to start testing immediately.

---

### Manual Setup (Alternative)

### 4. Start PostgreSQL

```bash
docker compose up -d postgres
```

This starts a PostgreSQL 15 (Alpine) container on port `5432` with:

- **Database**: `banking_db`
- **User**: `postgres`
- **Password**: `password`

Verify the container is running:

```bash
docker compose ps
```

### 4. Install Dependencies

```bash
npm install
```

> This automatically runs `prisma generate` via the `postinstall` script.

### 5. Run Database Migrations

```bash
npx prisma migrate dev
```

This creates all tables (`Person`, `Account`, `Transaction`) with indexes and constraints.

### 6. Start the Application

```bash
# Development mode (hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 7. Access Swagger Documentation

Open your browser and navigate to:

```
http://localhost:3000/docs
```

Swagger UI provides interactive API documentation with:

- All endpoint definitions with request/response schemas
- "Try it out" functionality for testing
- API Key authentication (click **Authorize** and enter your API key)

> **Note**: Swagger is controlled by the `SWAGGER_ENABLED` environment variable. Set it to `true` to enable.

### 8. Seed the Database

Populate the database with a sample person and account:

```bash
npx prisma db seed
```

Output:

```
🌱 Seeding database...
✅ Person created: John Doe (publicId: <uuid1>)
✅ Account created: <accountId1> (balance: 10000)
✅ Person created: Jane Smith (publicId: <uuid2>)
✅ Account created: <accountId2> (balance: 5000)

📋 Seed Summary:
   Person 1       : John Doe (<uuid1>)
   Account 1      : <accountId1> (balance: 10000)
   Person 2       : Jane Smith (<uuid2>)
   Account 2      : <accountId2> (balance: 5000)

🚀 You can now use these IDs to test the API (including transfers!)
```

> The seed is idempotent — you can run it multiple times safely.

### 9. Quick Start Example

Use the `accountId` values from the seed output. Replace `your-api-key` with your `.env` `API_KEY` value.

**Deposit Funds**

```bash
curl -s -X POST http://localhost:3000/api/accounts/<accountId1>/deposit \
  -H "Content-Type: application/json" \
  -H "apiKey: your-api-key" \
  -d '{
    "amount": 5000,
    "idempotencyKey": "deposit-001"
  }' | jq .
```

**Withdraw Funds**

```bash
curl -s -X POST http://localhost:3000/api/accounts/<accountId1>/withdraw \
  -H "Content-Type: application/json" \
  -H "apiKey: your-api-key" \
  -d '{
    "amount": 3000,
    "idempotencyKey": "withdraw-001"
  }' | jq .
```

**Transfer Between Accounts**

```bash
curl -s -X POST http://localhost:3000/api/accounts/<accountId1>/transfer \
  -H "Content-Type: application/json" \
  -H "apiKey: your-api-key" \
  -d '{
    "targetAccountId": "<accountId2>",
    "amount": 2000,
    "idempotencyKey": "transfer-001"
  }' | jq .
```

**Check Balance**

```bash
curl -s http://localhost:3000/api/accounts/<accountId1>/balance \
  -H "apiKey: your-api-key" | jq .
```

**View Transaction Statements**

```bash
curl -s "http://localhost:3000/api/accounts/<accountId1>/statements?page=1&limit=10" \
  -H "apiKey: your-api-key" | jq .
```

> **Tip**: Try depositing with the same `idempotencyKey` again — you'll get a `409 Conflict`, demonstrating the duplicate transaction protection.

---

## API Reference

All endpoints require the `apiKey` header for authentication (except `/health`).

Base URL: `http://localhost:3000/api`

### Health Check

| Method | Path      | Description                    | Auth |
| ------ | --------- | ------------------------------ | ---- |
| GET    | `/health` | Health check (DB connectivity) | None |

### Persons

| Method | Path                                | Description                         | Auth    |
| ------ | ----------------------------------- | ----------------------------------- | ------- |
| POST   | `/api/persons`                      | Create a new person                 | API Key |
| GET    | `/api/persons`                      | List all active persons (paginated) | API Key |
| GET    | `/api/persons/:publicId`            | Get person by publicId              | API Key |
| PATCH  | `/api/persons/:publicId`            | Update person details               | API Key |
| DELETE | `/api/persons/:publicId`            | Soft delete a person                | API Key |
| PATCH  | `/api/persons/:publicId/reactivate` | Reactivate a deleted person         | API Key |

#### Create Person — Example

```bash
curl -X POST http://localhost:3000/api/persons \
  -H "Content-Type: application/json" \
  -H "apiKey: your-api-key" \
  -d '{
    "name": "John Doe",
    "document": "123.456.789-00",
    "birthDate": "1990-01-15T00:00:00.000Z"
  }'
```

**Response** (201):

```json
{
  "success": true,
  "data": {
    "publicId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "document": "123.456.789-00",
    "birthDate": "1990-01-15T00:00:00.000Z",
    "status": "ACTIVE"
  }
}
```

### Accounts

| Method | Path                                  | Description                   | Auth    |
| ------ | ------------------------------------- | ----------------------------- | ------- |
| POST   | `/api/accounts`                       | Create a new account          | API Key |
| GET    | `/api/accounts`                       | List all accounts (paginated) | API Key |
| GET    | `/api/accounts/:accountId`            | Get account by ID             | API Key |
| PATCH  | `/api/accounts/:accountId`            | Update account details        | API Key |
| PATCH  | `/api/accounts/:accountId/block`      | Block an account              | API Key |
| GET    | `/api/accounts/:accountId/balance`    | Get account balance           | API Key |
| POST   | `/api/accounts/:accountId/deposit`    | Deposit funds                 | API Key |
| POST   | `/api/accounts/:accountId/withdraw`   | Withdraw funds                | API Key |
| POST   | `/api/accounts/:accountId/transfer`   | Transfer between accounts     | API Key |
| GET    | `/api/accounts/:accountId/statements` | Get transaction history       | API Key |

#### Deposit — Example

```bash
curl -X POST http://localhost:3000/api/accounts/{accountId}/deposit \
  -H "Content-Type: application/json" \
  -H "apiKey: your-api-key" \
  -d '{
    "amount": 10000,
    "idempotencyKey": "unique-uuid-here"
  }'
```

#### Withdraw — Example

```bash
curl -X POST http://localhost:3000/api/accounts/{accountId}/withdraw \
  -H "Content-Type: application/json" \
  -H "apiKey: your-api-key" \
  -d '{
    "amount": 5000,
    "idempotencyKey": "unique-uuid-here"
  }'
```

#### Transfer — Example

```bash
curl -X POST http://localhost:3000/api/accounts/{sourceAccountId}/transfer \
  -H "Content-Type: application/json" \
  -H "apiKey: your-api-key" \
  -d '{
    "targetAccountId": "{targetAccountId}",
    "amount": 2000,
    "idempotencyKey": "unique-uuid-here"
  }'
```

#### Statements with Date Filter — Example

```bash
curl "http://localhost:3000/api/accounts/{accountId}/statements?page=1&limit=10&fromDate=2026-02-01&toDate=2026-02-28" \
  -H "apiKey: your-api-key"
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "transactionId": "...",
        "value": 10000,
        "transactionDate": "2026-02-20T07:00:00.000Z",
        "idempotencyKey": "...",
        "type": "DEPOSIT"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### Pagination

All list endpoints support pagination via query parameters:

| Parameter | Type   | Default | Description    |
| --------- | ------ | ------- | -------------- |
| `page`    | number | 1       | Page number    |
| `limit`   | number | 20      | Items per page |

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Active account with id xxx not found",
    "statusCode": 404
  },
  "timestamp": "2026-02-20T07:00:00.000Z",
  "requestId": "uuid"
}
```

| Status Code | Scenario                                                     |
| ----------- | ------------------------------------------------------------ |
| 400         | Validation error, insufficient balance, daily limit exceeded |
| 401         | Missing or invalid API key                                   |
| 404         | Resource not found or inactive                               |
| 409         | Duplicate idempotency key, account already blocked           |
| 429         | Rate limit exceeded                                          |
| 500         | Internal server error                                        |

---

## Implementation Statement by Period

This section documents the chronological implementation phases, the key decisions made, and the rationale behind each.

### Phase 1 — Project Foundation (Feb 18)

**Commits**: Initial setup, dependency installation, Docker Compose, Prisma schema

**What was implemented**:

- Initialized NestJS project with TypeScript
- Configured PostgreSQL 15 via Docker Compose with health checks and persistent volumes
- Defined Prisma schema with three models: `Person`, `Account`, `Transaction`
- Set up `PrismaService` with lifecycle hooks for connection management

**Why**: Established the infrastructure-first approach — database and ORM before business logic. Docker Compose ensures a reproducible development environment. Prisma was chosen for its type-safe query builder, migration system, and excellent developer experience.

---

### Phase 2 — Security & Middleware (Feb 18–19)

**Commits**: API Key auth, Helmet, CORS, rate limiting, logging, versioning

**What was implemented**:

- API Key authentication using Passport's `HeaderAPIKeyStrategy`
- Helmet security headers with Content Security Policy
- CORS with configurable origins and credentials
- Rate limiting (ThrottlerGuard) with environment-based configuration
- Pino structured logging with request ID tracing and PII redaction
- Header-based API versioning with `VERSION_NEUTRAL` fallback
- Gzip compression for response payloads

**Why**: Security should be built in from the start, not bolted on. Each middleware addresses a specific attack vector: Helmet for XSS/clickjacking, rate limiting for DDoS, API keys for access control. Pino was chosen over Winston for its superior performance (5x faster in benchmarks).

---

### Phase 3 — Common Infrastructure (Feb 19)

**Commits**: GlobalExceptionFilter, TransformInterceptor, SerializeInterceptor, ValidationPipe, Health Check

**What was implemented**:

- `GlobalExceptionFilter` that catches all exceptions (HTTP, Prisma, unknown) and returns standardized error responses with request IDs
- `TransformInterceptor` wrapping all responses in `{ success, data }` format
- `@Serialize` decorator for automatic DTO transformation (supports single objects, arrays, and paginated `{ items, meta }` responses)
- `ValidationPipe` with whitelist mode and strict unknown field rejection
- Health check endpoint using `@nestjs/terminus` with Prisma health indicator

**Why**: These cross-cutting concerns ensure consistency across all endpoints without requiring explicit handling in each controller. The interceptor chain (Serialize → Transform) automatically formats all responses, reducing boilerplate and eliminating inconsistencies.

---

### Phase 4 — Person CRUD (Feb 19)

**Commits**: PersonEntity, CreatePersonDto, full CRUD with soft delete and reactivation

**What was implemented**:

- Full Person CRUD: Create, Read (single + paginated list), Update, Delete
- Soft delete using a `status` enum (ACTIVE=1, INACTIVE=2, DELETED=3) with `deletedAt` timestamp
- Person reactivation endpoint to restore deleted persons
- `publicId` (UUID) as the external identifier, hiding the internal auto-increment `personId`
- Pagination support with `page` and `limit` query parameters

**Why**: Soft delete preserves data integrity — since Accounts reference Persons via foreign keys, hard delete would cause referential integrity violations or require cascade deletes that destroy financial records. The `publicId` pattern prevents enumeration attacks while maintaining efficient integer-based joins internally.

---

### Phase 5 — Account Management (Feb 19–20)

**Commits**: AccountEntity, account creation, deposit, findAll/findOne/update, balance inquiry, block endpoint

**What was implemented**:

- Account creation linked to Person via `publicId` (validates person exists and is active)
- `AccountType` enum for account categorization
- Deposit endpoint with idempotency key (unique constraint + P2002 conflict handling)
- Balance inquiry endpoint returning minimal `{ accountId, balance }` response
- Account blocking endpoint with already-blocked validation
- Paginated account listing with filtering

**Why**: Account creation validates the owning Person's status to prevent creating accounts for deleted persons. The deposit operation introduces the idempotency pattern that is reused for withdrawals. P2002 error handling provides a database-level safety net in addition to the application-level check.

---

### Phase 6 — Financial Operations (Feb 20)

**Commits**: Withdrawal endpoint, statement endpoint with date filter

**What was implemented**:

- Withdrawal with `SELECT FOR UPDATE` pessimistic locking inside Prisma interactive transactions
- Balance validation (cannot withdraw more than current balance)
- Cumulative daily withdrawal limit enforcement (sums all withdrawals since 00:00:00 UTC)
- Transaction statements endpoint with pagination and optional `fromDate`/`toDate` filtering
- Shared `TRANSACTION_OPTIONS` constant for timeout/maxWait configuration
- Extracted `checkIdempotency` helper method to eliminate duplication between deposit and withdraw

**Why**: The withdrawal operation is the most critical in the system — it modifies money. `SELECT FOR UPDATE` prevents lost updates by serializing concurrent access. The daily limit check uses cumulative totals (not per-transaction limits) to prevent circumvention via multiple small withdrawals. Transaction timeouts prevent deadlocks from blocking the entire system.

---

### Phase 7 — Code Quality & Refactoring (Feb 20)

**Commits**: Return types, utility extraction, type alignment, Prisma Client types

**What was implemented**:

- Explicit return types on all service methods (`Promise<Account>`, `Promise<PaginatedResult<T>>`, etc.)
- `PaginatedResult<T>` generic interface for consistent paginated responses
- `parsePagination` and `getStartOfDay` utility functions extracted to common module
- Migrated type imports from auto-generated schema classes to Prisma Client types for accurate nullable type handling
- Made `idempotencyKey` required (non-nullable) in Prisma schema

**Why**: Explicit return types improve IDE IntelliSense, catch type errors at compile time, and serve as living documentation. Using Prisma Client types instead of auto-generated classes ensures that nullable fields (`Date | null`) are correctly represented, preventing runtime type mismatches.

---

### Phase 8 — Testing & CI (Feb 20)

**Commits**: Unit tests, E2E tests, bug fix, seed script, build pipeline

**What was implemented**:

- **47 unit tests** across 7 suites: `PersonsService` (9), `AccountsService` (21), `PersonsController` (1), `AccountsController` (1), `parsePagination` (5), `getStartOfDay` (4), `AppController` (1). All services tested with mocked `PrismaService`, including newly added `transfer` method tests (4 cases).
- **31 E2E tests** simulating a full banking user flow: health check, API key auth, person CRUD with soft delete/reactivation, account creation, deposits with idempotency, withdrawals with balance/daily-limit/race-condition validation, account-to-account transfers (including concurrent double transfer prevention), transaction statements, and account blocking.
- **Bug fix**: `$queryRaw` in `withdraw()` referenced the Prisma model name `"Account"` instead of the actual PostgreSQL table `"accounts"` (mapped via `@@map`), causing P2010 errors at runtime
- **Prisma seed** (`prisma/seed.ts`): Creates two sample persons (John Doe, Jane Smith) with checking accounts for immediate API testing including transfers. Idempotent via `upsert`
- **Build pipeline**: `npm run build` now runs unit tests → E2E tests → `nest build`. Added `test:all` shortcut
- **Jest configuration**: Added `moduleNameMapper` to resolve `src/` path aliases in both unit and E2E test configs

**Why**: Comprehensive testing is essential for a financial application — every transaction path must be verified. The E2E suite caught a real production bug in the withdrawal SQL query. The seed script eliminates manual setup for evaluators, and the test-gated build ensures no broken code is deployed.

---

## Testing

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (requires running database)
npm run test:e2e

# All tests (unit + e2e)
npm run test:all

# Test coverage
npm run test:cov

# Build (automatically runs unit + e2e tests before compiling)
npm run build
```

### Test Strategy

| Category   | Framework                 | Scope                                 |
| ---------- | ------------------------- | ------------------------------------- |
| Unit Tests | Jest (mock PrismaService) | Services, Guards, Interceptors, Utils |
| E2E Tests  | Jest + Supertest          | Full HTTP flow with real database     |

### Coverage Targets

| Module                                 | Target    |
| -------------------------------------- | --------- |
| Services                               | ≥ 90%     |
| Controllers                            | ≥ 80%     |
| Common (Guards, Interceptors, Filters) | ≥ 85%     |
| Utilities                              | 100%      |
| **Overall**                            | **≥ 85%** |

---

## Known Limitations

| Area                  | Current State                  | Impact                                                   |
| --------------------- | ------------------------------ | -------------------------------------------------------- |
| **Authentication**    | Static API Key via header      | Not suitable for multi-tenant production use             |
| **Authorization**     | No role-based access control   | Any valid API key can access all endpoints               |
| **Currency**          | Integer-only amounts (cents)   | No multi-currency support or decimal handling            |
| **Logging**           | Structured JSON logging (Pino) | No centralized log aggregation configured                |
| **Caching**           | No caching layer               | Balance queries always hit the database                  |
| **Config Validation** | `@nestjs/config` only          | No schema validation on environment variables at startup |
| **Monitoring**        | Health check endpoint only     | No metrics export (Prometheus, DataDog, etc.)            |

---

## Future Improvements

### High Priority

- **JWT Authentication** — Replace static API key with JWT tokens for per-user sessions and refresh token rotation
- **Role-Based Access Control (RBAC)** — Admin vs. user roles with endpoint-level permissions
- **Config Validation** — Use `class-validator` with `@nestjs/config` to fail fast on missing/invalid environment variables
- **CI/CD Pipeline** — GitHub Actions for lint → test → build → Docker push on every PR

### Medium Priority

- **Transaction History Enrichment** — Add `description` field and reference ID linking paired transfer transactions
- **Account Types** — Savings accounts with interest calculation, different withdrawal rules per type
- **Pagination Cursors** — Cursor-based pagination for large transaction histories (more efficient than offset)
- **Redis Caching** — Cache balance lookups with write-through invalidation on deposit/withdraw/transfer
- **Rate Limiting Per Account** — Per-account rate limits in addition to global IP-based throttling

### Low Priority / Nice to Have

- **Webhooks** — Notify external systems on transaction events (deposit, withdrawal, transfer)
- **Audit Log** — Immutable event log separate from transaction records for compliance
- **Multi-Currency** — Currency field on accounts with exchange rate service integration
- **Batch Transfers** — Bulk transfer endpoint for payroll-style operations
- **Swagger Codegen** — Auto-generated TypeScript SDK from OpenAPI spec for client consumption

---

## License

This project is [MIT licensed](LICENSE).
