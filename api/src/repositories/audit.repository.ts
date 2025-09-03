import type { AuditLog, AuditLogCreateInput, AuditLogWhereInput, AuditLogOrderByWithRelationInput } from '../types.js';
import { prisma } from '../database.js';
import type { IAuditRepository } from './interfaces.js';

export class AuditRepository implements IAuditRepository {
  async create(data: AuditLogCreateInput): Promise<AuditLog> {
    return await prisma.auditLog.create({
      data,
    });
  }

  async findByUserId(
    userId: string,
    params: {
      skip?: number;
      take?: number;
      orderBy?: AuditLogOrderByWithRelationInput;
    } = {}
  ): Promise<AuditLog[]> {
    const { skip, take, orderBy = { createdAt: 'desc' } } = params;
    
    return await prisma.auditLog.findMany({
      where: { userId },
      skip,
      take,
      orderBy,
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: AuditLogWhereInput;
    orderBy?: AuditLogOrderByWithRelationInput;
  } = {}): Promise<AuditLog[]> {
    const { skip, take, where, orderBy = { createdAt: 'desc' } } = params;
    
    return await prisma.auditLog.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });
    
    return result.count;
  }
}