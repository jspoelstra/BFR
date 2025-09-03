import { describe, it, expect } from 'vitest';
import { ProgressRepository } from '../src/repositories/progress.repository.js';
import { UserRepository } from '../src/repositories/user.repository.js';

const progressRepository = new ProgressRepository();
const userRepository = new UserRepository();

describe('ProgressRepository', () => {
  describe('create', () => {
    it('should create user progress', async () => {
      // First create a user
      const user = await userRepository.create({
        email: 'progress@example.com',
        username: 'progressuser',
        passwordHash: 'hashedpassword123',
      });

      const progressData = {
        sections: { '91.103': { read: true, quiz: 0.8 } },
        flashcards: { '91.103': 5 },
      };

      const progress = await progressRepository.create({
        userId: user.id,
        progressData,
      });

      expect(progress).toBeDefined();
      expect(progress.id).toBeDefined();
      expect(progress.userId).toBe(user.id);
      expect(progress.progressData).toEqual(progressData);
      expect(progress.version).toBe(1);
    });
  });

  describe('findByUserId', () => {
    it('should find progress by user id', async () => {
      const user = await userRepository.create({
        email: 'findprogress@example.com',
        username: 'findprogressuser',
        passwordHash: 'hashedpassword123',
      });

      const progressData = {
        sections: { '91.105': { read: true } },
      };

      const createdProgress = await progressRepository.create({
        userId: user.id,
        progressData,
      });

      const foundProgress = await progressRepository.findByUserId(user.id);

      expect(foundProgress).toBeDefined();
      expect(foundProgress?.id).toBe(createdProgress.id);
      expect(foundProgress?.userId).toBe(user.id);
      expect(foundProgress?.progressData).toEqual(progressData);
    });

    it('should return null for non-existent user', async () => {
      const foundProgress = await progressRepository.findByUserId('550e8400-e29b-41d4-a716-446655440000');
      expect(foundProgress).toBeNull();
    });
  });

  describe('update', () => {
    it('should update progress data', async () => {
      const user = await userRepository.create({
        email: 'updateprogress@example.com',
        username: 'updateprogressuser',
        passwordHash: 'hashedpassword123',
      });

      const initialData = {
        sections: { '91.107': { read: false } },
      };

      const createdProgress = await progressRepository.create({
        userId: user.id,
        progressData: initialData,
      });

      const updatedData = {
        sections: { '91.107': { read: true, quiz: 0.9 } },
      };

      const updatedProgress = await progressRepository.update(createdProgress.id, {
        progressData: updatedData,
      });

      expect(updatedProgress.progressData).toEqual(updatedData);
      expect(updatedProgress.version).toBe(1); // version doesn't auto-increment in regular update
    });
  });

  describe('upsert', () => {
    it('should create new progress if none exists', async () => {
      const user = await userRepository.create({
        email: 'upsert1@example.com',
        username: 'upsert1user',
        passwordHash: 'hashedpassword123',
      });

      const progressData = {
        sections: { '91.109': { read: true } },
      };

      const progress = await progressRepository.upsert(user.id, {
        userId: user.id,
        progressData,
      });

      expect(progress).toBeDefined();
      expect(progress.userId).toBe(user.id);
      expect(progress.progressData).toEqual(progressData);
      expect(progress.version).toBe(1);
    });

    it('should update existing progress', async () => {
      const user = await userRepository.create({
        email: 'upsert2@example.com',
        username: 'upsert2user',
        passwordHash: 'hashedpassword123',
      });

      // Create initial progress
      const initialData = {
        sections: { '91.111': { read: false } },
      };

      await progressRepository.create({
        userId: user.id,
        progressData: initialData,
      });

      // Upsert with new data
      const updatedData = {
        sections: { '91.111': { read: true, quiz: 0.85 } },
      };

      const upsertedProgress = await progressRepository.upsert(user.id, {
        userId: user.id,
        progressData: updatedData,
      });

      expect(upsertedProgress.progressData).toEqual(updatedData);
      expect(upsertedProgress.version).toBe(2); // version incremented in upsert
    });
  });

  describe('delete', () => {
    it('should delete user progress', async () => {
      const user = await userRepository.create({
        email: 'deleteprogress@example.com',
        username: 'deleteprogressuser',
        passwordHash: 'hashedpassword123',
      });

      const progress = await progressRepository.create({
        userId: user.id,
        progressData: { sections: {} },
      });

      await progressRepository.delete(progress.id);

      const foundProgress = await progressRepository.findByUserId(user.id);
      expect(foundProgress).toBeNull();
    });
  });
});