import fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from './lib/logger.js';
import { errorHandler } from './lib/errors.js';

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

export function buildApp() {
  const app = fastify({
    loggerInstance: logger,
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
  });

  // CORS
  app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'x-request-id'],
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Register API Routes under /api/v1
  app.register(healthRoutes, { prefix: '/api/v1' });
  app.register(exceptionRoutes, { prefix: '/api/v1' });
  app.register(workflowRoutes, { prefix: '/api/v1' });
  app.register(runRoutes, { prefix: '/api/v1' });
  app.register(approvalRoutes, { prefix: '/api/v1' });
  app.register(connectionRoutes, { prefix: '/api/v1' });
  app.register(evidenceRoutes, { prefix: '/api/v1' });
  app.register(auditRoutes, { prefix: '/api/v1' });
  app.register(reportRoutes, { prefix: '/api/v1' });
  app.register(eventRoutes, { prefix: '/api/v1' });

  return app;
}
