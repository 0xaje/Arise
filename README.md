# ARISE

### Autonomous Revenue Intelligence & Settlement Engine

ARISE autonomously investigates and resolves unapplied cash exceptions using Coasty's visual computer-use agent.

It investigates payment records, remittance advice, customer accounts, and invoices, reconciles the evidence, enforces human approval for high-value transactions, performs the settlement through the real accounting UI, and independently verifies the resulting ledger state.

**No selectors.**  
**No mocks.**  
**No simulators.**  
**No database shortcuts.**

---

## 🏆 Competition Result

```text
68 real Coasty visual steps
18/18 business stages completed
10/10 evidence artifacts verified
$14,850.00 USD payment successfully applied (PAY-WIRE-99210)
Invoice successfully settled (INV-2026-8812 -> $0.00 zero balance)
Human approval enforced ($14,850.00 > $10,000.00 authority threshold)
Same-run execution resume
Independent business outcome verification (RESOLVED / VERIFIED)
SHA-256 evidence integrity validated
```

---

## 🧱 System Architecture

```text
                   ┌──────────────────────┐
                   │   ARISE Command      │
                   │      Center          │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ Execution            │
                   │ Orchestrator         │
                   └──────────┬───────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
      ┌────────────┐   ┌─────────────┐   ┌─────────────┐
      │Reconciliation│ │ Risk Policy │   │ Human Gate  │
      └──────┬─────┘   └──────┬──────┘   └──────┬──────┘
             │                │                 │
             └────────────────┼─────────────────┘
                              ▼
                    ┌──────────────────┐
                    │ Coasty Agent     │
                    │ Visual Computer  │
                    │ Use              │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Real Accounting  │
                    │ Application      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Independent      │
                    │ Verification     │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
          ┌──────────────┐       ┌──────────────┐
          │ Evidence     │       │ Audit Trail  │
          │ SHA-256      │       │ + Export     │
          └──────────────┘       └──────────────┘
```

---

## 📋 The 18 Business Stages

ARISE operates through an 18-stage deterministic resolution loop:

1. **Intake & Environment Setup**: Launches authenticated desktop session and opens Finance Operations workspace.
2. **Exception Case Locating**: Filters queue and locates target case `EXC-HIGH-9901`.
3. **Payment Record Inspection**: Locates unapplied wire payment `PAY-WIRE-99210`.
4. **Payment Attribute Verification**: Reads payment status (`UNAPPLIED`), gross amount (`$14,850.00`), and deposit date.
5. **Remittance Advice Discovery**: Locates remittance document `REM-WIRE-8812`.
6. **Remittance Information Validation**: Validates remittance issuer name, net wire amount, and target invoice reference `INV-2026-8812`.
7. **Customer Account Search**: Opens customer master record `Globex Corporation` (`ACC-9901`).
8. **Customer Ledger Inspection**: Reads customer standing, open ledger balance (`$14,850.00 USD`), and credit terms.
9. **Customer Payment History Review**: Inspects 12-month payment history to confirm wire transfer pattern.
10. **Invoice Discovery & Inspection**: Locates open invoice `INV-2026-8812`.
11. **Invoice Ledger Verification**: Reads invoice original balance, due date, and outstanding amount (`$14,850.00 USD`).
12. **Remittance-to-Invoice Reconciliation**: Cross-reconciles payment, remittance advice, customer ledger, and invoice reference.
13. **Risk Authority Policy Assessment**: Evaluates transaction risk policy and detects `$14,850.00 > $10,000.00` limit.
14. **Human Governance Approval Gate**: Pauses execution in `APPROVAL_REQUIRED` state and renders High-Value Approval Request `APP-9901`.
15. **Human Decision & Resume**: Receives operator approval (`APPROVED`) and resumes the **same Coasty run execution**.
16. **Payment Application Posting**: Posts the approved payment application to invoice `INV-2026-8812` through the web UI.
17. **Post-Action Ledger Verification**: Independently re-inspects payment and invoice records to verify `APPLIED` status, `PAID` status, and `$0.00` zero balance.
18. **Evidence Integrity & Audit Closure**: Computes SHA-256 hashes for all 10 evidence items and finalizes cryptographic audit bundle.

---

## 🚀 Key Technical Innovations

* **Verification Integrity Decoupling**: Systems never claim `VERIFIED` simply because Coasty finished. Outcome verification requires independent re-inspection proving `ObservedBusinessState == ExpectedBusinessState`.
* **Same-Run Resume**: When human approval is granted, ARISE resumes the active Coasty run context (`COASTY-RUN-X`) without spawning duplicate runs.
* **Cryptographic Audit Package Exporter**: Downloadable compliance bundles (`GET /api/v1/runs/:id/export`) containing complete run metadata, SHA-256 evidence manifests, and bundle signatures.
* **Automated Cash Application Reversal**: Operators can trigger cash application reversals (`POST /api/v1/runs/:id/reverse`) to safely un-apply payments and record auditable reversal events.
* **Collision-Resistant ULID Run IDs**: Unique ULID-based run IDs (`RUN-...`) ensure zero ID collisions across high-volume transaction streams.

---

## 🛠️ Technology Stack

* **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons.
* **Backend**: Fastify Web Server, Prisma ORM, PostgreSQL (`arise_db`), Server-Sent Events (SSE).
* **AI Computer-Use Engine**: Coasty API (`ember-orbit`, Ubuntu Desktop).

---

## ⚡ Quickstart & Setup

### 1. Prerequisites
- Node.js (v18+ or v20+)
- PostgreSQL (v14+)

### 2. Environment Configuration
Copy `.env.example` to `backend/.env` and update credentials:
```bash
cp .env.example backend/.env
```

Set your Coasty API key in `backend/.env`:
```env
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arise_db
COASTY_API_KEY=your_coasty_api_key_here
COASTY_BASE_URL=https://coasty.ai/v1
COASTY_MACHINE_ID=c0380719-b0cf-4e99-ac83-4bbf55ff3932
FINAL_COMPETITION_EXECUTION_ENABLED=false
```

### 3. Database Migration & Setup
```bash
cd backend
npm install
npx prisma db push
```

### 4. Running Backend & Frontend
```bash
# Start Fastify Backend Server (Port 8000)
cd backend
npm run build
node dist/server.js

# Start Vite Frontend Dev Server (Port 5173)
# In a new terminal window:
npm run dev
```

### 5. Running Test Suite
```bash
cd backend
npm test
```

---

## 🛡️ License

MIT License. Built for Autonomous Finance Competitions.
