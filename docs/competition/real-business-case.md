# REAL BUSINESS CASE SPECIFICATION

## Environment

```text
Application:      Enterprise Accounting & Ledger Management System
Application URL:  http://localhost:8000/app
Machine ID:       c0380719-b0cf-4e99-ac83-4bbf55ff3932
Machine Name:     ember-orbit
OS:               Ubuntu Desktop
Browser:          Google Chrome
```

## Selected Case Details

```text
Case ID:               EXC-HIGH-9901
Payment ID:            PAY-WIRE-99210
Customer ID:           CUST-GLOBEX-9901
Customer Name:         Globex Corporation
Account Number:        ACC-9901
Invoice ID:            INV-2026-8812
Remittance Reference:  REM-WIRE-8812
Payment Amount:        $14,850.00 USD
Invoice Outstanding:   $14,850.00 USD
```

## Business Exception

> Unapplied payment `PAY-WIRE-99210` ($14,850.00 USD) arrived via wire transfer from Globex Corporation without automated matching. Customer ledger `ACC-9901` contains open invoice `INV-2026-8812` ($14,850.00 USD). Because the amount exceeds the $10,000.00 auto-approval threshold, the agent must investigate remittance advice, confirm matching criteria, pause for human governance sign-off, post the approved application, and visually verify that invoice `INV-2026-8812` is marked PAID and unapplied cash balance is $0.00.

## Actual Before State

```text
Payment:
  id: PAY-WIRE-99210
  amount: 14850.00
  currency: USD
  status: UNAPPLIED
  remittanceRef: REM-WIRE-8812

Customer:
  id: CUST-GLOBEX-9901
  name: Globex Corporation
  accountNumber: ACC-9901
  openBalance: 14850.00

Invoice:
  id: INV-2026-8812
  customer: Globex Corporation
  amount: 14850.00
  outstandingBalance: 14850.00
  status: UNPAID
```

## Candidate Analysis & Classification

1. **Candidate 1: Globex Corporation (EXC-HIGH-9901)** -> `CLEAR_MATCH` (Selected). Outstanding remittance match with governance threshold demonstration ($14,850.00 > $10,000.00).
2. **Candidate 2: Acme Corp (EXC-M-1786007893853)** -> `CLEAR_MATCH`. Remittance match under auto-approval threshold ($4,500.00 < $10,000.00).
3. **Candidate 3: Beta LLC (EXC-MIS-1786007893876)** -> `MISMATCH`. Discrepancy between remittance wire reference and invoice ledger.

## Proposed Resolution

> Validate customer identity and remittance wire `REM-WIRE-8812`, verify matching invoice `INV-2026-8812`, trigger human governance approval due to $14,850.00 amount, post approved payment application to ledger upon operator sign-off, and visually verify final zero balance.

## Expected Post-Resolution State

```text
Payment:
  status: APPLIED
  unappliedAmount: 0.00

Invoice:
  status: PAID
  outstandingBalance: 0.00

Relationship:
  payment PAY-WIRE-99210 linked to invoice INV-2026-8812
```

## Approval Requirement Analysis

```text
Payment Amount:        $14,850.00 USD
Configured Threshold:  $10,000.00 USD
Approval Required:     YES
Reason:                Transaction amount exceeds auto-settlement limit ($14,850.00 > $10,000.00).
```

## Reversal Strategy

> Payment application can be reversed natively in the accounting portal via "Unapply Payment / Reverse Posting" action on transaction `PAY-WIRE-99210`, returning the ledger state to `UNAPPLIED` cash and invoice `INV-2026-8812` status to `UNPAID` ($14,850.00 outstanding).

## Verification Strategy

> Deterministic comparison of `ExpectedBusinessState` vs `ObservedBusinessState` captured by Coasty visual computer-use inspection after posting. Cryptographic SHA-256 evidence hashing applied to all captured screen artifacts.

## Evidence Plan

1. **Evidence 01**: Unapplied payment ledger screen (`PAY-WIRE-99210`)
2. **Evidence 02**: Remittance advice document (`REM-WIRE-8812`)
3. **Evidence 03**: Customer account ledger (`ACC-9901`)
4. **Evidence 04**: Open invoice ledger screen (`INV-2026-8812`)
5. **Evidence 05**: Risk & governance evaluation screen
6. **Evidence 06**: ARISE human approval decision record (`APP-9901`)
7. **Evidence 07**: Post-resolution payment application status (`APPLIED`)
8. **Evidence 08**: Post-resolution invoice balance (`$0.00 / PAID`)

## Why This Case Is Competition-Worthy

- **Genuine Software Interface**: Operates against authentic business software via Coasty computer-use.
- **Full Governance Loop**: Demonstrates automated risk evaluation, human pause/resume approval, and audited execution.
- **Deep 50+ Step Potential**: Multi-stage investigation across customer search, ledger inspection, remittance matching, authority checks, operator interaction, posting, and visual verification.
- **Deterministic Outcome Verification**: Proves independent business outcome verification (No false-positive success claims).
