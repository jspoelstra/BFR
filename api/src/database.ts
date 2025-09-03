import { mockPrisma } from './mockDatabase.js';

// For development/testing when Prisma client generation fails
// This provides a compatible interface for the repositories
export const prisma = mockPrisma;