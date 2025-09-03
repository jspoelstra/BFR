import type { UserProgress, UserProgressCreateInput, UserProgressUpdateInput } from '../types.js';
import { prisma } from '../database.js';
import type { IProgressRepository } from './interfaces.js';

export class ProgressRepository implements IProgressRepository {
  async create(data: UserProgressCreateInput): Promise<UserProgress> {
    return await prisma.userProgress.create({
      data,
    });
  }

  async findByUserId(userId: string): Promise<UserProgress | null> {
    return await prisma.userProgress.findUnique({
      where: { userId },
    });
  }

  async update(id: string, data: UserProgressUpdateInput): Promise<UserProgress> {
    return await prisma.userProgress.update({
      where: { id },
      data,
    });
  }

  async upsert(userId: string, data: UserProgressCreateInput): Promise<UserProgress> {
    return await prisma.userProgress.upsert({
      where: { userId },
      create: data,
      update: {
        progressData: data.progressData,
        version: data.version ? data.version + 1 : 2,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.userProgress.delete({
      where: { id },
    });
  }
}