import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import fs from 'node:fs';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { storageService } from '../../services/storageService.js';
import { EvidenceType } from '@prisma/client';

const createEvidenceSchema = z.object({
  runId: z.string().min(1),
  stepId: z.string().optional(),
  type: z.nativeEnum(EvidenceType).default(EvidenceType.SCREENSHOT),
  base64Data: z.string().min(1),
  fileName: z.string().default('evidence.png'),
  mimeType: z.string().default('image/png'),
  metadataJson: z.string().optional(),
});

export async function evidenceRoutes(fastify: FastifyInstance) {
  // GET /api/v1/evidence
  fastify.get('/evidence', async (request) => {
    const { runId, stepId } = request.query as { runId?: string; stepId?: string };
    const where: any = {};
    if (runId) where.runId = runId;
    if (stepId) where.stepId = stepId;

    return prisma.evidenceItem.findMany({
      where,
      orderBy: { capturedAt: 'desc' },
      include: { run: true, step: true }
    });
  });

  // GET /api/v1/evidence/:id
  fastify.get('/evidence/:id', async (request) => {
    const { id } = request.params as { id: string };
    const evidence = await prisma.evidenceItem.findUnique({
      where: { id },
      include: { run: true, step: true }
    });

    if (!evidence) {
      throw new AppError('EVIDENCE_NOT_FOUND', `EvidenceItem '${id}' not found`, 404);
    }

    return evidence;
  });

  // GET /api/v1/evidence/files/:fileName (Static file server handler)
  fastify.get('/evidence/files/:fileName', async (request, reply) => {
    const { fileName } = request.params as { fileName: string };
    const filePath = storageService.getFilePath(fileName);

    if (!fs.existsSync(filePath)) {
      throw new AppError('FILE_NOT_FOUND', `Evidence artifact '${fileName}' not found on storage disk`, 404);
    }

    const stream = fs.createReadStream(filePath);
    return reply.send(stream);
  });

  // POST /api/v1/evidence (Create real stored evidence artifact)
  fastify.post('/evidence', async (request, reply) => {
    const data = createEvidenceSchema.parse(request.body);
    const run = await prisma.agentRun.findUnique({ where: { id: data.runId } });

    if (!run) {
      throw new AppError('RUN_NOT_FOUND', `AgentRun '${data.runId}' not found`, 404);
    }

    const buffer = Buffer.from(data.base64Data, 'base64');
    const { url, sha256, sizeBytes } = await storageService.saveFile(buffer, data.fileName, data.mimeType);

    const created = await prisma.evidenceItem.create({
      data: {
        runId: data.runId,
        stepId: data.stepId || null,
        type: data.type,
        storageUrl: url,
        capturedAt: new Date(),
        sha256,
        mimeType: data.mimeType,
        sizeBytes,
        metadataJson: data.metadataJson || null,
      }
    });

    reply.status(201);
    return created;
  });
}
