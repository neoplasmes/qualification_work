import { describe, it, expect } from 'vitest';
import { getInitialAppState } from './index';

describe('getInitialAppState', () => {
  it('returns isReady as false', () => {
    expect(getInitialAppState().isReady).toBe(false);
  });

  it('returns locale as "en"', () => {
    expect(getInitialAppState().locale).toBe('en');
  });

  it('returns a new object on each call', () => {
    expect(getInitialAppState()).not.toBe(getInitialAppState());
  });
});
