# ARISE — Backend Engine (Phase 1)

Autonomous Revenue Intelligence & Settlement Engine backend foundation powered by Fastify, Prisma ORM, PostgreSQL, Zod, and Pino.

## Architecture & Tech Stack

* **Framework**: Fastify v5
* **Database**: PostgreSQL 16
* **ORM**: Prisma ORM
* **Validation**: Zod
* **Logging**: Pino (Structured Logging with Request Correlation IDs)
* **Events**: Server-Sent Events (SSE) + EventBus
* **Audit**: Tamper-Evident SHA-256 Hashing Chain

## Quick Start & Setup

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `DATABASE_URL` points to your PostgreSQL instance:

```env
PORT=8000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arise_db
COASTY_BASE_URL=
COASTY_API_KEY=
EVIDENCE_STORAGE_PATH=./storage/evidence
```

### 2. Database Migrations & Prisma Generation

```bash
npm run prisma:generate
npm run prisma:push
```

### 3. Start Backend Server

Development Mode:
```bash
npm run dev
```

Production Build:
```bash
npm run build
npm start
```

### 4. Run Automated Integration Tests

```bash
npm test
```

## API Endpoints (`/api/v1`)

* `GET /api/v1/health` — Health check & PostgreSQL availability
* `GET /api/v1/workflows` — List workflows
* `POST /api/v1/workflows` — Create workflow
* `PATCH /api/v1/workflows/:id/status` — Toggle workflow status (DRAFT, ACTIVE, PAUSED, DISABLED)
* `POST /api/v1/workflows/:id/run` — Queue workflow execution (supports Idempotency-Key)
* `GET /api/v1/exceptions` — Filter/search exception cases
* `GET /api/v1/exceptions/:id` — Get exception details
* `POST /api/v1/exceptions/:id/resolve` — Mark exception resolved
* `GET /api/v1/runs` — List agent runs
* `GET /api/v1/runs/:id` — Get run details
* `GET /api/v1/runs/:id/steps` — Get execution step timeline
* `GET /api/v1/runs/:id/evidence` — Get run evidence items
* `GET /api/v1/runs/:id/events` — Get run live events
* `GET /api/v1/approvals` — List human approval requests
* `POST /api/v1/approvals/:id/decision` — Submit approval decision (APPROVED/REJECTED)
* `GET /api/v1/connections` — List infrastructure system connections
* `PATCH /api/v1/connections/:id` — Update connection settings
* `POST /api/v1/connections/:id/test` — Test integration connectivity
* `GET /api/v1/evidence` — List evidence artifacts
* `POST /api/v1/evidence` — Upload evidence artifact
* `GET /api/v1/audit` — Tamper-evident audit trail log
* `GET /api/v1/reports/summary` — Dynamically calculated financial metrics from DB
* `GET /api/v1/events/stream` — Real-time Server-Sent Events (SSE) stream

## AgentRun State Machine

Transitions are strictly validated:

```
QUEUED → STARTING → RUNNING ──┬─→ WAITING ──→ RUNNING
                             ├─→ APPROVAL_REQUIRED ──→ RUNNING
                             ├─→ RECOVERING ──→ RUNNING
                             ├─→ COMPLETED
                             ├─→ FAILED
                             └─→ CANCELLED
```
