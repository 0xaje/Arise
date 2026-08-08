import fastify from 'fastify';
import cors from '@fastify/cors';
import { ConnectionType, RiskScore } from '@prisma/client';
import { logger } from './lib/logger.js';
import { errorHandler } from './lib/errors.js';
import { prisma } from './lib/prisma.js';

import { healthRoutes } from './modules/health/health.routes.js';
import { exceptionRoutes } from './modules/exceptions/exceptions.routes.js';
import { workflowRoutes } from './modules/workflows/workflows.routes.js';
import { runRoutes } from './modules/runs/runs.routes.js';
import { approvalRoutes } from './modules/approvals/approvals.routes.js';
import { connectionRoutes } from './modules/connections/connections.routes.js';
import { evidenceRoutes } from './modules/evidence/evidence.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { reportRoutes } from './modules/reports/reports.routes.js';
import { eventRoutes } from './modules/events/events.routes.js';
import { coastyWebhookRoutes } from './modules/webhooks/coastyWebhook.routes.js';

export function buildApp() {
  const app = fastify({
    loggerInstance: logger,
    requestIdHeader: 'x-request-id',
  });

  // CORS configuration to support Vercel, Render, and local development
  app.register(cors, {
    origin: (_origin, cb) => {
      cb(null, true);
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'x-request-id', 'x-coasty-signature'],
    credentials: true,
  });

  // Seed default connections if database is empty
  prisma.connectionSystem.count().then(count => {
    if (count === 0) {
      prisma.connectionSystem.createMany({
        data: [
          {
            name: 'Coasty Agent Node (ember-orbit)',
            type: ConnectionType.COASTY,
            status: 'Connected',
            endpointUrl: 'https://coasty.ai/v1 (c0380719-b0cf-4e99-ac83-4bbf55ff3932)',
            lastVerifiedAt: new Date()
          },
          {
            name: 'Stripe Payment Gateway',
            type: ConnectionType.PAYMENT,
            status: 'Connected',
            endpointUrl: 'https://api.stripe.com/v1',
            lastVerifiedAt: new Date()
          },
          {
            name: 'NetSuite ERP System',
            type: ConnectionType.ACCOUNTING,
            status: 'Connected',
            endpointUrl: 'https://netsuite.api.internal/v1',
            lastVerifiedAt: new Date()
          },
          {
            name: 'Enterprise Ledger Management System',
            type: ConnectionType.ACCOUNTING,
            status: 'Connected',
            endpointUrl: 'http://localhost:8000/app',
            lastVerifiedAt: new Date()
          }
        ]
      }).catch(() => {});
    }
  }).catch(() => {});

  // Seed default competition workflow if database is empty
  prisma.workflow.count().then(count => {
    if (count === 0) {
      prisma.workflow.create({
        data: {
          name: 'Autonomous Cash Application Workflow',
          description: 'Reconciles unapplied wire payments, remittance advice, and customer invoices with $10,000 human approval threshold.',
          category: 'Competition Workflow',
          triggerEvent: 'Unapplied Cash Exception',
          status: 'ACTIVE',
          autoApprovalThreshold: 10000.00,
          maxSteps: 75,
          timeoutSeconds: 600,
          retryLimit: 3
        }
      }).catch(() => {});
    }
  }).catch(() => {});

  // Seed default exception case if database is empty
  prisma.exceptionCase.count().then(count => {
    if (count === 0) {
      prisma.exceptionCase.create({
        data: {
          caseNumber: 'EXC-HIGH-9901',
          customerName: 'Globex Corporation',
          accountNumber: 'ACC-9901',
          exceptionType: 'UNAPPLIED_CASH',
          amount: 14850.00,
          currency: 'USD',
          status: 'PENDING',
          riskScore: RiskScore.HIGH,
          sourceSystem: 'Bank Remittance Feed',
          description: 'Unapplied wire payment PAY-WIRE-99210 requiring remittance matching to invoice INV-2026-8812.',
          suggestedAction: 'Execute visual computer-use settlement with human approval sign-off.',
          confidence: 0.98,
        }
      }).catch(() => {});
    }
  }).catch(() => {});

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Root Welcome Route
  app.get('/', async () => {
    return {
      name: 'ARISE — Autonomous Revenue Intelligence & Settlement Engine',
      version: '1.0.0',
      status: 'online',
      health: '/api/v1/health',
      documentation: 'https://github.com/0xaje/Arise',
      endpoints: {
        health: '/api/v1/health',
        exceptions: '/api/v1/exceptions',
        workflows: '/api/v1/workflows',
        runs: '/api/v1/runs',
        approvals: '/api/v1/approvals',
        accountingPortal: '/app',
      }
    };
  });

  // Target Accounting Portal Root Route
  app.get('/app', async (request, reply) => {
    reply.header('Content-Type', 'text/html');
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Enterprise Accounting & Ledger Management System</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
    .card { max-width: 900px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; p: 32px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .badge { background: #0284c7; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
    .table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px; }
    .table th, .table td { border-bottom: 1px solid #334155; padding: 12px; text-align: left; }
    .table th { background: #0f172a; color: #94a3b8; }
    .status-applied { color: #4ade80; font-weight: bold; }
    .status-unapplied { color: #fbbf24; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1 style="font-size: 24px; margin: 0;">Enterprise Accounting & Ledger System</h1>
      <span class="badge">Live Production Instance</span>
    </div>

    <h3 style="margin-top: 32px; font-size: 16px; color: #cbd5e1;">Target Case: Globex Corporation (EXC-HIGH-9901)</h3>
    <table class="table">
      <thead>
        <tr><th>Transaction ID</th><th>Reference</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-family: monospace; font-weight: bold;">PAY-WIRE-99210</td>
          <td>REM-WIRE-8812</td>
          <td>Globex Corporation</td>
          <td>$14,850.00 USD</td>
          <td class="status-applied">APPLIED ($0.00 Unapplied)</td>
        </tr>
        <tr>
          <td style="font-family: monospace; font-weight: bold;">INV-2026-8812</td>
          <td>REM-WIRE-8812</td>
          <td>Globex Corporation</td>
          <td>$14,850.00 USD</td>
          <td class="status-applied">PAID ($0.00 Outstanding)</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
    `;
  });

  // Register API Routes under /api/v1
  const routeModules = [
    healthRoutes,
    exceptionRoutes,
    workflowRoutes,
    runRoutes,
    approvalRoutes,
    connectionRoutes,
    evidenceRoutes,
    auditRoutes,
    reportRoutes,
    eventRoutes,
    coastyWebhookRoutes,
  ];

  for (const routeModule of routeModules) {
    app.register(routeModule, { prefix: '/api/v1' });
    app.register(routeModule, { prefix: '' });
  }

  return app;
}
