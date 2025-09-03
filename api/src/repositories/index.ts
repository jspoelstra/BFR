// Repository interfaces
export * from './interfaces.js';

// Repository implementations
export { UserRepository } from './user.repository.js';
export { ProgressRepository } from './progress.repository.js';
export { PasswordResetRepository } from './passwordReset.repository.js';
export { AuditRepository } from './audit.repository.js';

// Repository factory for dependency injection
import { UserRepository } from './user.repository.js';
import { ProgressRepository } from './progress.repository.js';
import { PasswordResetRepository } from './passwordReset.repository.js';
import { AuditRepository } from './audit.repository.js';

export const createRepositories = () => ({
  user: new UserRepository(),
  progress: new ProgressRepository(),
  passwordReset: new PasswordResetRepository(),
  audit: new AuditRepository(),
});

export type Repositories = ReturnType<typeof createRepositories>;