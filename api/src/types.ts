// Manual type definitions that match our Prisma schema
// These types mirror the schema.prisma file

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  emailVerified: boolean;
  active: boolean;
}

export interface UserProgress {
  id: string;
  userId: string;
  progressData: any; // JSON data
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  details: any | null; // JSON data
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// Create input types
export interface UserCreateInput {
  email: string;
  username: string;
  passwordHash: string;
  role?: string;
  emailVerified?: boolean;
  active?: boolean;
}

export interface UserUpdateInput {
  email?: string;
  username?: string;
  passwordHash?: string;
  role?: string;
  lastLogin?: Date;
  emailVerified?: boolean;
  active?: boolean;
}

export interface UserWhereInput {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
  active?: boolean;
}

export interface UserOrderByWithRelationInput {
  id?: 'asc' | 'desc';
  email?: 'asc' | 'desc';
  username?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
}

export interface UserProgressCreateInput {
  userId: string;
  progressData: any;
  version?: number;
}

export interface UserProgressUpdateInput {
  progressData?: any;
  version?: number;
}

export interface PasswordResetTokenCreateInput {
  userId: string;
  token: string;
  expiresAt: Date;
  used?: boolean;
}

export interface AuditLogCreateInput {
  userId?: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogWhereInput {
  userId?: string;
  action?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
    gt?: Date;
    lt?: Date;
  };
}

export interface AuditLogOrderByWithRelationInput {
  createdAt?: 'asc' | 'desc';
  action?: 'asc' | 'desc';
}