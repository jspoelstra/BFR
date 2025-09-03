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
} from '../types.js';

// User Repository Interface
export interface IUserRepository {
  create(data: UserCreateInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(id: string, data: UserUpdateInput): Promise<User>;
  delete(id: string): Promise<void>;
  findMany(params?: {
    skip?: number;
    take?: number;
    where?: UserWhereInput;
    orderBy?: UserOrderByWithRelationInput;
  }): Promise<User[]>;
}

// Progress Repository Interface
export interface IProgressRepository {
  create(data: UserProgressCreateInput): Promise<UserProgress>;
  findByUserId(userId: string): Promise<UserProgress | null>;
  update(id: string, data: UserProgressUpdateInput): Promise<UserProgress>;
  upsert(userId: string, data: UserProgressCreateInput): Promise<UserProgress>;
  delete(id: string): Promise<void>;
}

// Password Reset Repository Interface
export interface IPasswordResetRepository {
  create(data: PasswordResetTokenCreateInput): Promise<PasswordResetToken>;
  findByToken(token: string): Promise<PasswordResetToken | null>;
  findActiveByUserId(userId: string): Promise<PasswordResetToken[]>;
  markAsUsed(id: string): Promise<PasswordResetToken>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<number>;
}

// Audit Log Repository Interface
export interface IAuditRepository {
  create(data: AuditLogCreateInput): Promise<AuditLog>;
  findByUserId(userId: string, params?: {
    skip?: number;
    take?: number;
    orderBy?: AuditLogOrderByWithRelationInput;
  }): Promise<AuditLog[]>;
  findMany(params?: {
    skip?: number;
    take?: number;
    where?: AuditLogWhereInput;
    orderBy?: AuditLogOrderByWithRelationInput;
  }): Promise<AuditLog[]>;
  deleteOlderThan(date: Date): Promise<number>;
}