import { z } from 'zod';

export const LoginRequestSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(1024),
});

export const AdminIdentitySchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/),
  username: z.string(),
});

export const SessionResponseSchema = z.object({
  admin: AdminIdentitySchema,
  csrfToken: z.string().min(32),
  expiresAt: z.string().datetime(),
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1).max(1024),
  newPassword: z.string().min(12).max(1024),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AdminIdentity = z.infer<typeof AdminIdentitySchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
