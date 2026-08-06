# ARISE Architecture & System Design

ARISE (**Autonomous Revenue Intelligence & Settlement Engine**) is an orchestration and observability platform designed to control autonomous workflows operating real external enterprise applications via Coasty computer vision agents.

## High-Level Architecture Flow

```text
Frontend (React + Vite Control Plane)
   ↓
ARISE API (/api/v1 - Fastify + Zod + Pino)
   ↓
Domain Services & State Machine (EventService, AuditService, StateMachine)
   ↓
PostgreSQL (Source of Truth via Prisma ORM)
   ↓
Execution Provider Adapter (CoastyExecutionProvider)
   ↓
Coasty Computer Use Runner
   ↓
Real External Applications (NetSuite ERP, Stripe, Salesforce CRM)
```

## System Layers

### 1. Control Plane (Frontend UI)
* React 19, TypeScript, TailwindCSS
* Consumes `/api/v1` REST endpoints & SSE stream
* Displays real-time operational status, exception queues, workflow rules, audit trails, and execution logs

### 2. API & Domain Layer (Fastify Backend)
* Implements Fastify REST endpoints under `/api/v1`
* Enforces Zod input validation & request correlation logging
* Validates AgentRun state transitions (`QUEUED` -> `STARTING` -> `RUNNING` -> `COMPLETED`)
* Writes SHA-256 tamper-evident audit logs and publishes SSE events

### 3. Database Layer (PostgreSQL)
* Real operational state stored in PostgreSQL 16
* Managed via Prisma ORM
* Source of truth for Workflows, ExceptionCases, AgentRuns, AgentSteps, EvidenceItems, ApprovalRequests, ConnectionSystems, AuditLogs, and LiveEvents

### 4. Execution Adapter Layer
* Decoupled `ExecutionProvider` interface
* `CoastyExecutionProvider` manages communication with Coasty browser agent runners
* Honest connection testing: returns `Not configured` when credentials/URL are absent
