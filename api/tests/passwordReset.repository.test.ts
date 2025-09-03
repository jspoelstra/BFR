import { describe, it, expect } from 'vitest';
import { PasswordResetRepository } from '../src/repositories/passwordReset.repository.js';
import { UserRepository } from '../src/repositories/user.repository.js';

const passwordResetRepository = new PasswordResetRepository();
const userRepository = new UserRepository();

describe('PasswordResetRepository', () => {
  describe('create', () => {
    it('should create password reset token', async () => {
      const user = await userRepository.create({
        email: 'reset@example.com',
        username: 'resetuser',
        passwordHash: 'hashedpassword123',
      });

      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      const tokenData = {
        userId: user.id,
        token: 'secure-reset-token-123',
        expiresAt,
      };

      const resetToken = await passwordResetRepository.create(tokenData);

      expect(resetToken).toBeDefined();
      expect(resetToken.id).toBeDefined();
      expect(resetToken.userId).toBe(user.id);
      expect(resetToken.token).toBe('secure-reset-token-123');
      expect(resetToken.expiresAt).toEqual(expiresAt);
      expect(resetToken.used).toBe(false);
    });
  });

  describe('findByToken', () => {
    it('should find token by token string', async () => {
      const user = await userRepository.create({
        email: 'findtoken@example.com',
        username: 'findtokenuser',
        passwordHash: 'hashedpassword123',
      });

      const tokenData = {
        userId: user.id,
        token: 'findable-token-456',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const createdToken = await passwordResetRepository.create(tokenData);
      const foundToken = await passwordResetRepository.findByToken('findable-token-456');

      expect(foundToken).toBeDefined();
      expect(foundToken?.id).toBe(createdToken.id);
      expect(foundToken?.token).toBe('findable-token-456');
      expect(foundToken?.userId).toBe(user.id);
    });

    it('should return null for non-existent token', async () => {
      const foundToken = await passwordResetRepository.findByToken('non-existent-token');
      expect(foundToken).toBeNull();
    });
  });

  describe('findActiveByUserId', () => {
    it('should find active tokens for user', async () => {
      const user = await userRepository.create({
        email: 'active@example.com',
        username: 'activeuser',
        passwordHash: 'hashedpassword123',
      });

      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago

      // Create active token
      await passwordResetRepository.create({
        userId: user.id,
        token: 'active-token-1',
        expiresAt: futureDate,
      });

      // Create expired token
      await passwordResetRepository.create({
        userId: user.id,
        token: 'expired-token-1',
        expiresAt: pastDate,
      });

      // Create used token
      const usedToken = await passwordResetRepository.create({
        userId: user.id,
        token: 'used-token-1',
        expiresAt: futureDate,
      });

      // Mark token as used
      await passwordResetRepository.markAsUsed(usedToken.id);

      const activeTokens = await passwordResetRepository.findActiveByUserId(user.id);

      expect(activeTokens).toHaveLength(1);
      expect(activeTokens[0].token).toBe('active-token-1');
      expect(activeTokens[0].used).toBe(false);
      expect(activeTokens[0].expiresAt > new Date()).toBe(true);
    });

    it('should return tokens ordered by creation date desc', async () => {
      const user = await userRepository.create({
        email: 'ordered@example.com',
        username: 'ordereduser',
        passwordHash: 'hashedpassword123',
      });

      const futureDate = new Date(Date.now() + 3600000);

      // Create first token
      await passwordResetRepository.create({
        userId: user.id,
        token: 'first-token',
        expiresAt: futureDate,
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create second token
      await passwordResetRepository.create({
        userId: user.id,
        token: 'second-token',
        expiresAt: futureDate,
      });

      const tokens = await passwordResetRepository.findActiveByUserId(user.id);

      expect(tokens).toHaveLength(2);
      expect(tokens[0].token).toBe('second-token'); // most recent first
      expect(tokens[1].token).toBe('first-token');
    });
  });

  describe('markAsUsed', () => {
    it('should mark token as used', async () => {
      const user = await userRepository.create({
        email: 'markused@example.com',
        username: 'markuseduser',
        passwordHash: 'hashedpassword123',
      });

      const tokenData = {
        userId: user.id,
        token: 'mark-used-token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const createdToken = await passwordResetRepository.create(tokenData);
      expect(createdToken.used).toBe(false);

      const markedToken = await passwordResetRepository.markAsUsed(createdToken.id);

      expect(markedToken.used).toBe(true);
      expect(markedToken.id).toBe(createdToken.id);
    });
  });

  describe('delete', () => {
    it('should delete password reset token', async () => {
      const user = await userRepository.create({
        email: 'deletetoken@example.com',
        username: 'deletetokenuser',
        passwordHash: 'hashedpassword123',
      });

      const token = await passwordResetRepository.create({
        userId: user.id,
        token: 'delete-me-token',
        expiresAt: new Date(Date.now() + 3600000),
      });

      await passwordResetRepository.delete(token.id);

      const foundToken = await passwordResetRepository.findByToken('delete-me-token');
      expect(foundToken).toBeNull();
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired and used tokens', async () => {
      const user = await userRepository.create({
        email: 'cleanup@example.com',
        username: 'cleanupuser',
        passwordHash: 'hashedpassword123',
      });

      const futureDate = new Date(Date.now() + 3600000);
      const pastDate = new Date(Date.now() - 3600000);

      // Create active token (should not be deleted)
      await passwordResetRepository.create({
        userId: user.id,
        token: 'active-token',
        expiresAt: futureDate,
      });

      // Create expired token (should be deleted)
      await passwordResetRepository.create({
        userId: user.id,
        token: 'expired-token',
        expiresAt: pastDate,
      });

      // Create used token (should be deleted)
      const usedToken = await passwordResetRepository.create({
        userId: user.id,
        token: 'used-token',
        expiresAt: futureDate,
      });

      await passwordResetRepository.markAsUsed(usedToken.id);

      const deletedCount = await passwordResetRepository.deleteExpired();

      expect(deletedCount).toBe(2); // expired + used

      // Verify active token still exists
      const activeTokens = await passwordResetRepository.findActiveByUserId(user.id);
      expect(activeTokens).toHaveLength(1);
      expect(activeTokens[0].token).toBe('active-token');
    });
  });
});