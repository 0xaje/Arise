export interface TaskBuilderContext {
  id?: string;
  caseNumber?: string;
  customerName?: string;
  accountNumber?: string;
  exceptionType?: string;
  amount?: number;
  currency?: string;
  sourceSystem?: string;
  description?: string;
  suggestedAction?: string;
}

export function buildInvestigationTask(context: TaskBuilderContext): string {
  const caseNo = context.caseNumber || 'EXC-HIGH-9901';
  const customer = context.customerName || 'Globex Corporation';
  const account = context.accountNumber || 'ACC-9901';
  const amount = context.amount || 14850.00;
  const currency = context.currency || 'USD';
  const source = context.sourceSystem || 'NetSuite ERP';

  return `
ROLE & IDENTITY:
You are ARISE, an autonomous finance-operations agent operating through the visible web interface of the business application.

BUSINESS OBJECTIVE:
Investigate unapplied cash exception ${caseNo} for ${customer} (${account}).
Target Payment: PAY-WIRE-99210 ($${amount} ${currency}) received via ${source}.
Target Remittance: REM-WIRE-8812.
Target Open Invoice: INV-2026-8812.

OPERATIONAL INSTRUCTIONS & WORKFLOW STAGES:
1. Open the accounting application at http://localhost:8000/app and confirm authenticated session.
2. Navigate to Finance Operations / Cash Application workspace.
3. Locate exception case ${caseNo} and open payment record PAY-WIRE-99210.
4. Read and visually verify payment ID, status (UNAPPLIED), gross amount ($${amount} ${currency}), and deposit date.
5. Open remittance advice REM-WIRE-8812 and read issuer name, remittance reference, and invoice reference INV-2026-8812.
6. Open customer account ${customer} (${account}), read standing, open balance, and payment history.
7. Open invoice record INV-2026-8812, read invoice status (UNPAID) and outstanding balance ($${amount} ${currency}).
8. Cross-reconcile payment, remittance advice, customer ledger, and invoice reference.
9. Evaluate risk policy: If the payment amount ($${amount} ${currency}) exceeds the $10,000.00 auto-settlement limit, STOP and request human governance approval.
10. DO NOT execute payment application posting until human approval sign-off is granted by ARISE.
11. After receiving human approval sign-off, post the approved payment application to invoice INV-2026-8812.
12. Re-inspect payment record PAY-WIRE-99210 and invoice record INV-2026-8812 to visually verify APPLIED status, PAID status, and $0.00 zero balance.

SAFETY DIRECTIVES:
- Interact STRICTLY through the visible computer interface (clicking visible buttons, reading text, typing in visible input fields).
- NEVER use DOM selectors, XPath, CSS selectors, or browser automation scripts.
- NEVER fabricate invoice numbers, remittance references, or transaction receipts.
- NEVER reveal authentication credentials, API tokens, or secrets.
- STOP and request human approval if transaction amount exceeds authorized limit.
- Claim success ONLY after visual on-screen verification of the resulting ledger state.
`.trim();
}
