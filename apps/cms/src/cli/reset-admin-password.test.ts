import { describe, expect, it } from 'vitest';

import { validatePasswordReset } from './reset-admin-password.js';

describe('administrator password reset validation', () => {
  it('only accepts a strong password when exactly one administrator exists', () => {
    expect(() => validatePasswordReset('long-enough-password', 1)).not.toThrow();
    expect(() => validatePasswordReset('short', 1)).toThrow(/12/);
    expect(() => validatePasswordReset('long-enough-password', 0)).toThrow(/exactly one/i);
    expect(() => validatePasswordReset('long-enough-password', 2)).toThrow(/exactly one/i);
  });
});
