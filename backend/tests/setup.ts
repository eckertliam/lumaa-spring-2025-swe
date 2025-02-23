import { jest } from '@jest/globals';

// Make jest available globally
global.jest = jest;

// Mock console.error to keep test output clean
console.error = jest.fn(); 