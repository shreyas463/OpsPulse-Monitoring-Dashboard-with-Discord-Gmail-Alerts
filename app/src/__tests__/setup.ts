// Jest setup file
import { register } from 'prom-client';

// Clear Prometheus metrics before each test
beforeEach(() => {
  register.clear();
});

// Global test timeout
jest.setTimeout(10000); 