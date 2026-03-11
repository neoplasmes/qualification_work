import { describe, it, expect } from 'vitest';
import { isValidEmail } from './validate-email.js';

describe('isValidEmail', () => {
  it('returns true for a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('returns false for an email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('returns false for an email without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});
