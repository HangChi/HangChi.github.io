import { describe, expect, it } from 'vitest';

import { validateInitialAdminPassword } from './create-admin.js';

describe('initial administrator password validation', () => {
  it('accepts eight characters and rejects seven characters', () => {
    expect(() => validateInitialAdminPassword('12345678')).not.toThrow();
    expect(() => validateInitialAdminPassword('1234567')).toThrow(/8/);
  });
});
