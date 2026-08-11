import { describe, expect, it } from 'vitest';

import { validatePasswordReset } from './reset-admin-password.js';

describe('administrator password reset validation', () => {
  it('accepts an eight-character password when exactly one administrator exists', () => {
    expect(() => validatePasswordReset('12345678', 1)).not.toThrow();
    expect(() => validatePasswordReset('1234567', 1)).toThrow(/8/);
    expect(() => validatePasswordReset('long-enough-password', 0)).toThrow(/exactly one/i);
    expect(() => validatePasswordReset('long-enough-password', 2)).toThrow(/exactly one/i);
  });
});
