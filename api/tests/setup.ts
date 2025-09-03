import { beforeAll, afterAll, beforeEach } from 'vitest';
import { clearMockStorage } from '../src/mockDatabase.js';

beforeAll(async () => {
  // Setup for mock database tests
  console.log('Setting up test environment with mock database');
});

beforeEach(async () => {
  // Clean up mock storage before each test
  clearMockStorage();
});

afterAll(async () => {
  // Cleanup after all tests
  console.log('Test environment cleanup complete');
});