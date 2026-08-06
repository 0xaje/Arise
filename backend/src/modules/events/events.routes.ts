import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { eventBus } from '../../services/eventService.js';

export async function eventRoutes(fastify: FastifyInstance) {
  // GET /api/v1/events/live (Recent live events)
  fastify.get('/events/live', async () => {
    return prisma.liveEvent.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50
    });
  });

  // GET /api/v1/events/stream (Server-Sent Events endpoint)
  fastify.get('/events/stream', (request, reply) => {
    const { runId } = request.query as { runId?: string };

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    reply.raw.flushHeaders();

    // Send initial connection event
    reply.raw.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to ARISE Live Event Stream', timestamp: new Date() })}\n\n`);

    const listener = (eventData: any) => {
      // Filter by runId if parameter is supplied
      if (runId && eventData.runId && eventData.runId !== runId) {
        return;
      }
      reply.raw.write(`event: live_event\ndata: ${JSON.stringify(eventData)}\n\n`);
    };

    eventBus.on('live_event', listener);

    request.raw.on('close', () => {
      eventBus.off('live_event', listener);
    });
  });
}
