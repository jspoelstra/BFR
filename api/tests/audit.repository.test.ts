import { describe, it, expect } from 'vitest';
import { AuditRepository } from '../src/repositories/audit.repository.js';
import { UserRepository } from '../src/repositories/user.repository.js';

const auditRepository = new AuditRepository();
const userRepository = new UserRepository();

describe('AuditRepository', () => {
  describe('create', () => {
    it('should create audit log entry', async () => {
      const user = await userRepository.create({
        email: 'audit@example.com',
        username: 'audituser',
        passwordHash: 'hashedpassword123',
      });

      const auditData = {
        userId: user.id,
        action: 'login',
        details: { method: 'password' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser',
      };

      const audit = await auditRepository.create(auditData);

      expect(audit).toBeDefined();
      expect(audit.id).toBeDefined();
      expect(audit.userId).toBe(user.id);
      expect(audit.action).toBe('login');
      expect(audit.details).toEqual({ method: 'password' });
      expect(audit.ipAddress).toBe('192.168.1.1');
      expect(audit.userAgent).toBe('Mozilla/5.0 Test Browser');
    });

    it('should create audit log entry without user (anonymous)', async () => {
      const auditData = {
        action: 'anonymous_access',
        details: { page: '/health' },
        ipAddress: '192.168.1.1',
      };

      const audit = await auditRepository.create(auditData);

      expect(audit).toBeDefined();
      expect(audit.userId).toBeNull();
      expect(audit.action).toBe('anonymous_access');
      expect(audit.details).toEqual({ page: '/health' });
    });
  });

  describe('findByUserId', () => {
    it('should find audit logs by user id', async () => {
      const user = await userRepository.create({
        email: 'auditfind@example.com',
        username: 'auditfinduser',
        passwordHash: 'hashedpassword123',
      });

      // Create multiple audit entries sequentially to ensure order
      await auditRepository.create({
        userId: user.id,
        action: 'login',
        ipAddress: '192.168.1.1',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await auditRepository.create({
        userId: user.id,
        action: 'logout',
        ipAddress: '192.168.1.1',
      });

      const audits = await auditRepository.findByUserId(user.id);

      expect(audits).toHaveLength(2);
      expect(audits[0].userId).toBe(user.id);
      expect(audits[1].userId).toBe(user.id);
      // Should be ordered by createdAt desc by default
      expect(audits[0].action).toBe('logout'); // most recent
    });

    it('should support pagination for user audit logs', async () => {
      const user = await userRepository.create({
        email: 'auditpage@example.com',
        username: 'auditpageuser',
        passwordHash: 'hashedpassword123',
      });

      // Create multiple audit entries
      await Promise.all([
        auditRepository.create({
          userId: user.id,
          action: 'action1',
        }),
        auditRepository.create({
          userId: user.id,
          action: 'action2',
        }),
        auditRepository.create({
          userId: user.id,
          action: 'action3',
        }),
      ]);

      const firstPage = await auditRepository.findByUserId(user.id, {
        take: 2,
      });

      expect(firstPage).toHaveLength(2);

      const secondPage = await auditRepository.findByUserId(user.id, {
        skip: 2,
        take: 2,
      });

      expect(secondPage).toHaveLength(1);
    });
  });

  describe('findMany', () => {
    it('should find all audit logs with filtering', async () => {
      const user1 = await userRepository.create({
        email: 'audit1@example.com',
        username: 'audit1user',
        passwordHash: 'hashedpassword123',
      });

      const user2 = await userRepository.create({
        email: 'audit2@example.com',
        username: 'audit2user',
        passwordHash: 'hashedpassword123',
      });

      await Promise.all([
        auditRepository.create({
          userId: user1.id,
          action: 'login',
        }),
        auditRepository.create({
          userId: user2.id,
          action: 'login',
        }),
        auditRepository.create({
          userId: user1.id,
          action: 'logout',
        }),
      ]);

      // Filter by action
      const loginAudits = await auditRepository.findMany({
        where: { action: 'login' },
      });

      expect(loginAudits).toHaveLength(2);
      expect(loginAudits.every(audit => audit.action === 'login')).toBe(true);

      // Filter by user
      const user1Audits = await auditRepository.findMany({
        where: { userId: user1.id },
      });

      expect(user1Audits).toHaveLength(2);
      expect(user1Audits.every(audit => audit.userId === user1.id)).toBe(true);
    });

    it('should support pagination and ordering', async () => {
      const user = await userRepository.create({
        email: 'auditorder@example.com',
        username: 'auditorderuser',
        passwordHash: 'hashedpassword123',
      });

      // Create entries with slight delay to ensure different timestamps
      await auditRepository.create({
        userId: user.id,
        action: 'first',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await auditRepository.create({
        userId: user.id,
        action: 'second',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await auditRepository.create({
        userId: user.id,
        action: 'third',
      });

      // Get in ascending order (oldest first)
      const ascending = await auditRepository.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(ascending[0].action).toBe('first');
      expect(ascending[2].action).toBe('third');
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete audit logs older than specified date', async () => {
      const user = await userRepository.create({
        email: 'auditdelete@example.com',
        username: 'auditdeleteuser',
        passwordHash: 'hashedpassword123',
      });

      // Create audit log entry
      await auditRepository.create({
        userId: user.id,
        action: 'old_action',
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const cutoffDate = new Date();

      // Wait a bit more
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create another entry after cutoff
      await auditRepository.create({
        userId: user.id,
        action: 'new_action',
      });

      // Delete entries older than cutoff
      const deletedCount = await auditRepository.deleteOlderThan(cutoffDate);

      expect(deletedCount).toBe(1);

      // Verify remaining entry
      const remaining = await auditRepository.findByUserId(user.id);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].action).toBe('new_action');
    });
  });
});