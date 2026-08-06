import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        version: '1.0.0',
        database: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      reply.status(503);
      return {
        status: 'error',
        version: '1.0.0',
        database: 'disconnected',
        error: err?.message || 'Database query failed'
      };
    }
  });
}
