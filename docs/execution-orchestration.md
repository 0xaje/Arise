# ARISE Execution Orchestration & Evidence Architecture

## Overview & Lifecycle

ARISE (**Autonomous Revenue Intelligence & Settlement Engine**) decouples the external Coasty computer-use execution status from the internal business outcome verification.

```text
Exception Case + Workflow
            ↓
  Execution Plan Builder
            ↓
   Execution Orchestrator
            ↓
  PostgreSQL Business Stages
            ↓
  Coasty Execution Provider (POST /v1/runs)
            ↓
  Real Computer Use Execution
            ↓
   Coasty Event Stream (SSE)
            ↓
Execution Event Processor (Deduplication + Terminal Lock)
            ↓
   AgentStep & Evidence Records
            ↓
  Business Outcome Verifier (SHA-256 + Criteria)
            ↓
Verified Business Outcome (RESOLVED / ESCALATED / PARTIAL / FAILED)
```

## Core Service Layers (`backend/src/services/execution/`)

1. **`execution.types.ts`**: Strongly-typed definitions for `ExecutionPlan`, `ExecutionPolicy`, `RiskLevel`, `VerificationResult`, `BusinessOutcomeStatus`, and `ExecutionStageDef`.
2. **`execution.errors.ts`**: Domain execution errors (`ExecutionError`, `PolicyViolationError`, `VerificationError`, `TerminalStateError`).
3. **`execution.policy.ts`**: Configurable risk authority levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). Automates approval threshold triggers for financial actions.
4. **`execution.plan.ts`**: Constructs structured execution plans outlining business objectives, case context, permitted applications, allowed actions, forbidden rules, and verification criteria.
5. **`execution.verifier.ts`**: Decoupled outcome verifier. Checks Coasty status vs business case resolution state. Performs SHA-256 file integrity checks on stored evidence.
6. **`execution.events.ts`**: Real-time event synchronizer. Enforces deduplication, terminal state locks, step accounting, and business stage progression.
7. **`execution.orchestrator.ts`**: Coordinates the entire run lifecycle asynchronously.

## Business Outcome vs Execution Status Separation

* **Execution Status**: Status of the external Coasty computer-use runner (`QUEUED`, `STARTING`, `RUNNING`, `APPROVAL_REQUIRED`, `COMPLETED`, `FAILED`, `CANCELLED`).
* **Business Outcome**: Verified operational outcome of the finance case (`PENDING`, `RESOLVED`, `PARTIAL`, `ESCALATED`, `FAILED`).

A run can cleanly have Execution Status `COMPLETED` while Business Outcome is `ESCALATED` (e.g. when transaction amount exceeds auto-approval limits).
