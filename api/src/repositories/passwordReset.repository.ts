import type { PasswordResetToken, PasswordResetTokenCreateInput } from '../types.js';
import { prisma } from '../database.js';
import type { IPasswordResetRepository } from './interfaces.js';

export class PasswordResetRepository implements IPasswordResetRepository {
  async create(data: PasswordResetTokenCreateInput): Promise<PasswordResetToken> {
    return await prisma.passwordResetToken.create({
      data,
    });
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return await prisma.passwordResetToken.findUnique({
      where: { token },
    });
  }

  async findActiveByUserId(userId: string): Promise<PasswordResetToken[]> {
    return await prisma.passwordResetToken.findMany({
      where: {
        userId,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAsUsed(id: string): Promise<PasswordResetToken> {
    return await prisma.passwordResetToken.update({
      where: { id },
      data: {
        used: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.passwordResetToken.delete({
      where: { id },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { used: true },
          {
            expiresAt: {
              lt: new Date(),
            },
          },
        ],
      },
    });
    
    return result.count;
  }
}