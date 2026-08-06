import { EventType, LiveEvent } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuditService } from './auditService.js';
import { EventEmitter } from 'node:events';

export interface EmitEventParams {
  runId?: string;
  type: EventType;
  message: string;
  payloadJson?: string | Record<string, any>;
  actorType?: string;
  actorId?: string;
}

class EventServiceEmitter extends EventEmitter {}
export const eventBus = new EventServiceEmitter();

export class EventService {
  public static async emit(params: EmitEventParams): Promise<LiveEvent> {
    const payloadStr = typeof params.payloadJson === 'object'
      ? JSON.stringify(params.payloadJson)
      : params.payloadJson || '';

    // 1. Update Database (Create LiveEvent)
    const liveEvent = await prisma.liveEvent.create({
      data: {
        runId: params.runId || null,
        type: params.type,
        message: params.message,
        payloadJson: payloadStr,
        timestamp: new Date(),
      }
    });

    // 2. Write AuditLog
    await AuditService.createLog({
      actorType: params.actorType || 'SYSTEM',
      actorId: params.actorId || 'arise-engine',
      action: params.type,
      resourceType: params.runId ? 'AgentRun' : 'System',
      resourceId: params.runId || liveEvent.id,
      detailsJson: params.message,
    });

    // 3. Publish to SSE Clients
    eventBus.emit('live_event', liveEvent);

    return liveEvent;
  }
}
