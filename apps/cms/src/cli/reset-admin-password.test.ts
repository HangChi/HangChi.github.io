import { describe, expect, it } from 'vitest';

import { isResetAdminPasswordEntrypoint, validatePasswordReset } from './reset-admin-password.js';

describe('administrator password reset validation', () => {
  it('accepts an eight-character password when exactly one administrator exists', () => {
    expect(() => validatePasswordReset('12345678', 1)).not.toThrow();
    expect(() => validatePasswordReset('1234567', 1)).toThrow(/8/);
    expect(() => validatePasswordReset('long-enough-password', 0)).toThrow(/exactly one/i);
    expect(() => validatePasswordReset('long-enough-password', 2)).toThrow(/exactly one/i);
  });
});

describe('administrator password reset entrypoint detection', () => {
  it('recognizes the deployed current symlink as the running module', () => {
    const resolveRealPath = (candidate: string) => candidate
      .replaceAll('\\', '/')
      .replace('/current/reset.js', '/releases/20260811/reset.js');

    expect(isResetAdminPasswordEntrypoint(
      '/opt/blog-cms/current/reset.js',
      '/opt/blog-cms/releases/20260811/reset.js',
      resolveRealPath,
    )).toBe(true);
  });
});
