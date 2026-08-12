import { describe, expect, it } from 'vitest';
import { safeReturnPath } from './auth';

describe('auth smoke', () => {
  it('keeps root as a valid return path', () => {
    expect(safeReturnPath('/')).toBe('/');
  });
});
