# ARISE Phase 4A — Real Environment & Machine Inventory

## 1. Coasty Machine & System Capabilities

```text
Environment:           Coasty Managed Cloud Environment
Machine ID:            c0380719-b0cf-4e99-ac83-4bbf55ff3932 (ember-orbit)
Operating System:      Linux (Ubuntu Desktop Environment)
Desktop Enabled:       True (GUI Desktop + Chrome Browser)
CPU Cores:             2
Memory:                4.0 GB
Storage:               10 GB
Computer-Use Protocol: Coasty CUA v3 (Visual Interface Control)
Interaction Method:    Pure Visual Computer-Use (No DOM/CSS/XPath Selectors)
```

## 2. Real Finance Application Environment

```text
Target Workflow:        Autonomous Cash Application & Exception Resolution
Target Software:        Enterprise Accounting & Ledger Management Portal (NetSuite / ERPNext / Bank Remittance Portal)
Application URL:        http://localhost:8000/app or https://accounting.arise-finance.org
Authentication:         Standard Web Session Authentication
Persistent Data:        PostgreSQL Ledger Database (arise_db)
Reversible Operations:  Payment posting, unapplied cash matching, ledger adjustments, status toggles
Evidence Capabilities:  Visual Screenshot Proof, Remittance Document Capture, Cryptographic SHA-256 Hashes
```

## 3. Real Business Records Inventory

| Record Category | Sample Identifiers | System Field Attributes | Verification Capability |
| :--- | :--- | :--- | :--- |
| **Unapplied Payment** | `PAY-99210`, `PAY-99211` | `amount`, `currency`, `remittanceInfo`, `status` | Visual check on-screen + DB query |
| **Customer Ledger** | `CUST-8812` (Globex Corp) | `accountNumber`, `balance`, `creditLimit` | Customer ledger screen inspection |
| **Open Invoice** | `INV-2026-8812` | `invoiceNumber`, `amountDue`, `paymentStatus` | Ledger status verification |
| **Remittance Advice** | `REM-WIRE-402` | `wireReference`, `invoiceReference`, `date` | Evidence screenshot sha256 link |

## 4. Operational Boundaries & Policy

```text
Autonomous Authority Limit:  $10,000.00
Human Approval Trigger:      Transactions exceeding $10,000.00 or ambiguous customer matches
Approval Mechanism:          Coasty pauses run → ARISE creates ApprovalRequest → Human operator decides in UI → Resume/Stop
No Selector Guarantee:       100% visual computer-use (clicks, typing, visual reading only)
```

## 5. Verification Architecture

```text
BEFORE STATE
Unapplied Payment: $14,850.00 (Unapplied)
Invoice INV-2026-8812: $14,850.00 (Unpaid)

ACTION
Coasty Computer-Use Agent inspects remittance advice, matches payment to invoice, submits application.

AFTER STATE
Unapplied Payment: $0.00 (Applied)
Invoice INV-2026-8812: $0.00 (Paid / Settled)
Observed Business State: Matched deterministically against Expected State
```
