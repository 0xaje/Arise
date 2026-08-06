import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { AuditLog } from '@prisma/client';

export interface CreateAuditLogParams {
  actorType: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  detailsJson?: string | Record<string, any>;
}

export class AuditService {
  public static async createLog(params: CreateAuditLogParams): Promise<AuditLog> {
    // Get the previous hash to form a tamper-evident hash chain
    const lastLog = await prisma.auditLog.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    const previousHash = lastLog ? lastLog.verificationHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const detailsString = typeof params.detailsJson === 'object' 
      ? JSON.stringify(params.detailsJson) 
      : params.detailsJson || '';

    // Calculate SHA-256 verification hash
    const hashPayload = `${previousHash}|${timestamp.toISOString()}|${params.actorType}|${params.actorId}|${params.action}|${params.resourceType}|${params.resourceId}|${detailsString}`;
    const verificationHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    return prisma.auditLog.create({
      data: {
        timestamp,
        actorType: params.actorType,
        actorId: params.actorId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        detailsJson: detailsString,
        previousHash,
        verificationHash,
      }
    });
  }
}
