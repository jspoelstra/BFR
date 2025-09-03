import { describe, it, expect } from 'vitest';
import { UserRepository } from '../src/repositories/user.repository.js';

const userRepository = new UserRepository();

describe('UserRepository', () => {
  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword123',
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user.passwordHash).toBe(userData.passwordHash);
      expect(user.role).toBe('user');
      expect(user.active).toBe(true);
      expect(user.emailVerified).toBe(false);
    });

    it('should create user with custom role', async () => {
      const userData = {
        email: 'admin@example.com',
        username: 'admin',
        passwordHash: 'hashedpassword123',
        role: 'admin',
      };

      const user = await userRepository.create(userData);

      expect(user.role).toBe('admin');
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userData = {
        email: 'find@example.com',
        username: 'finduser',
        passwordHash: 'hashedpassword123',
      };

      const createdUser = await userRepository.create(userData);
      const foundUser = await userRepository.findById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should return null for non-existent id', async () => {
      const foundUser = await userRepository.findById('non-existent-id');
      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'email@example.com',
        username: 'emailuser',
        passwordHash: 'hashedpassword123',
      };

      const createdUser = await userRepository.create(userData);
      const foundUser = await userRepository.findByEmail(userData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const userData = {
        email: 'username@example.com',
        username: 'uniqueuser',
        passwordHash: 'hashedpassword123',
      };

      const createdUser = await userRepository.create(userData);
      const foundUser = await userRepository.findByUsername(userData.username);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.username).toBe(userData.username);
    });

    it('should return null for non-existent username', async () => {
      const foundUser = await userRepository.findByUsername('nonexistentuser');
      expect(foundUser).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const userData = {
        email: 'update@example.com',
        username: 'updateuser',
        passwordHash: 'hashedpassword123',
      };

      const createdUser = await userRepository.create(userData);
      const updatedUser = await userRepository.update(createdUser.id, {
        email: 'updated@example.com',
        role: 'instructor',
      });

      expect(updatedUser.email).toBe('updated@example.com');
      expect(updatedUser.role).toBe('instructor');
      expect(updatedUser.username).toBe(userData.username); // unchanged
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const userData = {
        email: 'delete@example.com',
        username: 'deleteuser',
        passwordHash: 'hashedpassword123',
      };

      const createdUser = await userRepository.create(userData);
      
      await userRepository.delete(createdUser.id);
      
      const foundUser = await userRepository.findById(createdUser.id);
      expect(foundUser).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find multiple users with pagination', async () => {
      // Create multiple users
      await Promise.all([
        userRepository.create({
          email: 'user1@example.com',
          username: 'user1',
          passwordHash: 'hash1',
        }),
        userRepository.create({
          email: 'user2@example.com',
          username: 'user2',
          passwordHash: 'hash2',
        }),
        userRepository.create({
          email: 'user3@example.com',
          username: 'user3',
          passwordHash: 'hash3',
        }),
      ]);

      const users = await userRepository.findMany({
        take: 2,
        orderBy: { email: 'asc' },
      });

      expect(users).toHaveLength(2);
      expect(users[0].email).toBe('user1@example.com');
      expect(users[1].email).toBe('user2@example.com');
    });

    it('should filter users by where condition', async () => {
      await Promise.all([
        userRepository.create({
          email: 'admin1@example.com',
          username: 'admin1',
          passwordHash: 'hash1',
          role: 'admin',
        }),
        userRepository.create({
          email: 'user1@example.com',
          username: 'normaluser1',
          passwordHash: 'hash2',
          role: 'user',
        }),
      ]);

      const adminUsers = await userRepository.findMany({
        where: { role: 'admin' },
      });

      expect(adminUsers).toHaveLength(1);
      expect(adminUsers[0].role).toBe('admin');
    });
  });
});