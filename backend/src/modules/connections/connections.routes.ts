import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { coastyProvider } from '../../adapters/executionProvider.js';
import { ConnectionType } from '@prisma/client';

const updateConnectionSchema = z.object({
  status: z.string().optional(),
  endpointUrl: z.string().url().optional(),
  metadataJson: z.string().optional(),
});

export async function connectionRoutes(fastify: FastifyInstance) {
  // GET /api/v1/connections
  fastify.get('/connections', async () => {
    return prisma.connectionSystem.findMany({
      orderBy: { createdAt: 'asc' }
    });
  });

  // PATCH /api/v1/connections/:id
  fastify.patch('/connections/:id', async (request) => {
    const { id } = request.params as { id: string };
    const data = updateConnectionSchema.parse(request.body);

    const connection = await prisma.connectionSystem.findUnique({ where: { id } });
    if (!connection) {
      throw new AppError('CONNECTION_NOT_FOUND', `ConnectionSystem '${id}' not found`, 404);
    }

    return prisma.connectionSystem.update({
      where: { id },
      data: {
        ...data,
        lastVerifiedAt: new Date(),
      }
    });
  });

  // POST /api/v1/connections/:id/test
  fastify.post('/connections/:id/test', async (request) => {
    const { id } = request.params as { id: string };
    const connection = await prisma.connectionSystem.findUnique({ where: { id } });

    if (!connection) {
      throw new AppError('CONNECTION_NOT_FOUND', `ConnectionSystem '${id}' not found`, 404);
    }

    if (connection.type === ConnectionType.COASTY) {
      const result = await coastyProvider.testConnection();
      await prisma.connectionSystem.update({
        where: { id },
        data: {
          status: result.success ? 'Connected' : 'Disconnected',
          lastVerifiedAt: new Date()
        }
      });
      return result;
    }

    // Honest check for HTTP API endpoints
    if (!connection.endpointUrl || connection.endpointUrl.includes('example.com') || connection.endpointUrl.includes('internal')) {
      await prisma.connectionSystem.update({
        where: { id },
        data: { status: 'Not configured', lastVerifiedAt: new Date() }
      });
      return {
        success: false,
        message: `Connection not configured: Endpoint URL '${connection.endpointUrl}' is placeholder or unconfigured.`
      };
    }

    try {
      const start = Date.now();
      const res = await fetch(connection.endpointUrl, { method: 'HEAD' });
      const latencyMs = Date.now() - start;

      const isConnected = res.status < 500;
      await prisma.connectionSystem.update({
        where: { id },
        data: {
          status: isConnected ? 'Connected' : 'Error',
          lastVerifiedAt: new Date()
        }
      });

      return {
        success: isConnected,
        message: isConnected ? `Connected cleanly to ${connection.name} (HTTP ${res.status}).` : `Server returned HTTP error ${res.status}`,
        latencyMs
      };
    } catch (err: any) {
      await prisma.connectionSystem.update({
        where: { id },
        data: { status: 'Disconnected', lastVerifiedAt: new Date() }
      });

      return {
        success: false,
        message: `Connection test failed for ${connection.name}: ${err?.message || 'Network error'}`
      };
    }
  });
}
