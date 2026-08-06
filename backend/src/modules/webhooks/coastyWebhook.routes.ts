import { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { coastyEventSync } from '../../services/coasty/coasty.events.js';
import { CoastyRunEvent } from '../../services/coasty/coasty.types.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

export async function coastyWebhookRoutes(fastify: FastifyInstance) {
  fastify.post('/webhooks/coasty', async (request, reply) => {
    const webhookSecret = process.env.COASTY_WEBHOOK_SECRET;
    const signature = request.headers['x-coasty-signature'] as string | undefined;

    // Verify HMAC Signature if secret is configured
    if (webhookSecret) {
      if (!signature) {
        throw new AppError('UNAUTHORIZED_WEBHOOK', 'Missing x-coasty-signature header', 401);
      }
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(request.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new AppError('INVALID_WEBHOOK_SIGNATURE', 'Invalid webhook signature', 401);
      }
    }

    const payload = request.body as {
      externalRunId?: string;
      run_id?: string;
      event: CoastyRunEvent;
    };

    const externalRunId = payload.externalRunId || payload.run_id || payload.event?.run_id;
    if (!externalRunId || !payload.event) {
      throw new AppError('BAD_REQUEST', 'Missing externalRunId or event object in webhook payload', 400);
    }

    logger.info({ externalRunId, eventType: payload.event.event_type }, 'Processing Coasty Webhook');

    // Idempotent event synchronizer
    await coastyEventSync.processEvent(externalRunId, payload.event);

    reply.status(200);
    return { received: true, externalRunId, eventType: payload.event.event_type };
  });
}
