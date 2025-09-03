// Mock database implementation for development/testing when Prisma client can't be generated
import type { 
  User, 
  UserProgress, 
  PasswordResetToken, 
  AuditLog,
  UserCreateInput,
  UserUpdateInput,
  UserWhereInput,
  UserOrderByWithRelationInput,
  UserProgressCreateInput,
  UserProgressUpdateInput,
  PasswordResetTokenCreateInput,
  AuditLogCreateInput,
  AuditLogWhereInput,
  AuditLogOrderByWithRelationInput
} from './types.js';

// In-memory storage for testing
const storage = {
  users: new Map<string, User>(),
  userProgress: new Map<string, UserProgress>(),
  passwordResetTokens: new Map<string, PasswordResetToken>(),
  auditLogs: new Map<string, AuditLog>(),
};

// Helper to generate UUIDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Mock Prisma client
export const mockPrisma = {
  user: {
    async create({ data }: { data: UserCreateInput }): Promise<User> {
      const id = generateId();
      const now = new Date();
      const user: User = {
        id,
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        role: data.role || 'user',
        createdAt: now,
        updatedAt: now,
        lastLogin: null,
        emailVerified: data.emailVerified || false,
        active: data.active !== undefined ? data.active : true,
      };
      storage.users.set(id, user);
      return user;
    },

    async findUnique({ where }: { where: { id?: string; email?: string; username?: string } }): Promise<User | null> {
      if (where.id) {
        return storage.users.get(where.id) || null;
      }
      if (where.email) {
        for (const user of storage.users.values()) {
          if (user.email === where.email) return user;
        }
      }
      if (where.username) {
        for (const user of storage.users.values()) {
          if (user.username === where.username) return user;
        }
      }
      return null;
    },

    async update({ where, data }: { where: { id: string }; data: UserUpdateInput }): Promise<User> {
      const user = storage.users.get(where.id);
      if (!user) throw new Error('User not found');
      
      const updated: User = {
        ...user,
        ...data,
        updatedAt: new Date(),
      };
      storage.users.set(where.id, updated);
      return updated;
    },

    async delete({ where }: { where: { id: string } }): Promise<User> {
      const user = storage.users.get(where.id);
      if (!user) throw new Error('User not found');
      storage.users.delete(where.id);
      return user;
    },

    async findMany({ skip = 0, take, where, orderBy }: {
      skip?: number;
      take?: number;
      where?: UserWhereInput;
      orderBy?: UserOrderByWithRelationInput;
    } = {}): Promise<User[]> {
      let users = Array.from(storage.users.values());

      // Apply where filter
      if (where) {
        users = users.filter(user => {
          if (where.id && user.id !== where.id) return false;
          if (where.email && user.email !== where.email) return false;
          if (where.username && user.username !== where.username) return false;
          if (where.role && user.role !== where.role) return false;
          if (where.active !== undefined && user.active !== where.active) return false;
          return true;
        });
      }

      // Apply ordering
      if (orderBy) {
        users.sort((a, b) => {
          if (orderBy.email) {
            const result = a.email.localeCompare(b.email);
            return orderBy.email === 'desc' ? -result : result;
          }
          if (orderBy.createdAt) {
            const result = a.createdAt.getTime() - b.createdAt.getTime();
            return orderBy.createdAt === 'desc' ? -result : result;
          }
          return 0;
        });
      }

      // Apply pagination
      return users.slice(skip, take ? skip + take : undefined);
    },
  },

  userProgress: {
    async create({ data }: { data: UserProgressCreateInput }): Promise<UserProgress> {
      const id = generateId();
      const now = new Date();
      const progress: UserProgress = {
        id,
        userId: data.userId,
        progressData: data.progressData,
        version: data.version || 1,
        createdAt: now,
        updatedAt: now,
      };
      storage.userProgress.set(id, progress);
      return progress;
    },

    async findUnique({ where }: { where: { userId: string } }): Promise<UserProgress | null> {
      for (const progress of storage.userProgress.values()) {
        if (progress.userId === where.userId) return progress;
      }
      return null;
    },

    async update({ where, data }: { where: { id: string }; data: UserProgressUpdateInput }): Promise<UserProgress> {
      const progress = storage.userProgress.get(where.id);
      if (!progress) throw new Error('User progress not found');
      
      const updated: UserProgress = {
        ...progress,
        ...data,
        updatedAt: new Date(),
      };
      storage.userProgress.set(where.id, updated);
      return updated;
    },

    async upsert({ where, create, update }: {
      where: { userId: string };
      create: UserProgressCreateInput;
      update: UserProgressUpdateInput;
    }): Promise<UserProgress> {
      const existing = await this.findUnique({ where });
      if (existing) {
        return await this.update({ where: { id: existing.id }, data: update });
      } else {
        return await this.create({ data: create });
      }
    },

    async delete({ where }: { where: { id: string } }): Promise<UserProgress> {
      const progress = storage.userProgress.get(where.id);
      if (!progress) throw new Error('User progress not found');
      storage.userProgress.delete(where.id);
      return progress;
    },
  },

  passwordResetToken: {
    async create({ data }: { data: PasswordResetTokenCreateInput }): Promise<PasswordResetToken> {
      const id = generateId();
      const token: PasswordResetToken = {
        id,
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
        used: data.used || false,
        createdAt: new Date(),
      };
      storage.passwordResetTokens.set(id, token);
      return token;
    },

    async findUnique({ where }: { where: { token: string } }): Promise<PasswordResetToken | null> {
      for (const token of storage.passwordResetTokens.values()) {
        if (token.token === where.token) return token;
      }
      return null;
    },

    async findMany({ where, orderBy }: {
      where?: any;
      orderBy?: any;
    } = {}): Promise<PasswordResetToken[]> {
      let tokens = Array.from(storage.passwordResetTokens.values());

      // Apply where filter
      if (where) {
        tokens = tokens.filter(token => {
          if (where.userId && token.userId !== where.userId) return false;
          if (where.used !== undefined && token.used !== where.used) return false;
          if (where.expiresAt?.gt && token.expiresAt <= where.expiresAt.gt) return false;
          return true;
        });
      }

      // Apply ordering
      if (orderBy?.createdAt === 'desc') {
        tokens.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      return tokens;
    },

    async update({ where, data }: { where: { id: string }; data: { used: boolean } }): Promise<PasswordResetToken> {
      const token = storage.passwordResetTokens.get(where.id);
      if (!token) throw new Error('Password reset token not found');
      
      const updated: PasswordResetToken = {
        ...token,
        ...data,
      };
      storage.passwordResetTokens.set(where.id, updated);
      return updated;
    },

    async delete({ where }: { where: { id: string } }): Promise<PasswordResetToken> {
      const token = storage.passwordResetTokens.get(where.id);
      if (!token) throw new Error('Password reset token not found');
      storage.passwordResetTokens.delete(where.id);
      return token;
    },

    async deleteMany({ where }: { where: any }): Promise<{ count: number }> {
      const tokensToDelete = [];
      for (const [id, token] of storage.passwordResetTokens.entries()) {
        if (where.OR) {
          const shouldDelete = where.OR.some((condition: any) => {
            if (condition.used === true && token.used) return true;
            if (condition.expiresAt?.lt && token.expiresAt < condition.expiresAt.lt) return true;
            return false;
          });
          if (shouldDelete) tokensToDelete.push(id);
        }
      }
      
      tokensToDelete.forEach(id => storage.passwordResetTokens.delete(id));
      return { count: tokensToDelete.length };
    },
  },

  auditLog: {
    async create({ data }: { data: AuditLogCreateInput }): Promise<AuditLog> {
      const id = generateId();
      const audit: AuditLog = {
        id,
        userId: data.userId || null,
        action: data.action,
        details: data.details || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        createdAt: new Date(),
      };
      storage.auditLogs.set(id, audit);
      return audit;
    },

    async findMany({ skip = 0, take, where, orderBy }: {
      skip?: number;
      take?: number;
      where?: AuditLogWhereInput;
      orderBy?: AuditLogOrderByWithRelationInput;
    } = {}): Promise<AuditLog[]> {
      let logs = Array.from(storage.auditLogs.values());

      // Apply where filter
      if (where) {
        logs = logs.filter(log => {
          if (where.userId && log.userId !== where.userId) return false;
          if (where.action && log.action !== where.action) return false;
          if (where.createdAt?.lt && log.createdAt >= where.createdAt.lt) return false;
          return true;
        });
      }

      // Apply ordering (default to desc)
      logs.sort((a, b) => {
        const result = b.createdAt.getTime() - a.createdAt.getTime();
        if (orderBy?.createdAt === 'asc') return -result;
        return result;
      });

      // Apply pagination
      return logs.slice(skip, take ? skip + take : undefined);
    },

    async deleteMany({ where }: { where: any }): Promise<{ count: number }> {
      const logsToDelete = [];
      for (const [id, log] of storage.auditLogs.entries()) {
        if (where.createdAt?.lt && log.createdAt < where.createdAt.lt) {
          logsToDelete.push(id);
        }
      }
      
      logsToDelete.forEach(id => storage.auditLogs.delete(id));
      return { count: logsToDelete.length };
    },
  },

  $queryRaw: async (query: any): Promise<any> => {
    // Mock database connection test
    return [{ test: 1 }];
  },

  $connect: async (): Promise<void> => {
    // Mock connection
  },

  $disconnect: async (): Promise<void> => {
    // Mock disconnection
  },
};

// Clear storage function for testing
export const clearMockStorage = (): void => {
  storage.users.clear();
  storage.userProgress.clear();
  storage.passwordResetTokens.clear();
  storage.auditLogs.clear();
};