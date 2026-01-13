import { describe, it, expect } from 'vitest';

describe('Server', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });
});

describe('Environment', () => {
  it('should have NODE_ENV set', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
