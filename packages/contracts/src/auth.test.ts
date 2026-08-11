import { describe, expect, it } from 'vitest';

import { ChangePasswordRequestSchema } from './auth.js';

describe('administrator password change contract', () => {
  it('accepts eight characters and rejects seven characters', () => {
    expect(ChangePasswordRequestSchema.safeParse({
      currentPassword: 'current-password',
      newPassword: '12345678',
    }).success).toBe(true);
    expect(ChangePasswordRequestSchema.safeParse({
      currentPassword: 'current-password',
      newPassword: '1234567',
    }).success).toBe(false);
  });
});
