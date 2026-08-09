import { z } from 'zod';

import { EntityIdSchema } from './posts.js';

export const PublishJobStatusSchema = z.enum(['queued', 'running', 'succeeded', 'failed']);
export const PublishTriggerSchema = z.enum([
  'publish',
  'unpublish',
  'delete',
  'restore',
  'retry',
  'manual',
  'rollback',
]);

export const PublishJobDtoSchema = z.object({
  id: EntityIdSchema,
  revision: z.number().int().nonnegative(),
  status: PublishJobStatusSchema,
  trigger: PublishTriggerSchema,
  releaseName: z.string().nullable(),
  errorSummary: z.string().nullable(),
  log: z.string(),
  queuedAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
});

export const DeploymentStateDtoSchema = z.object({
  databaseRevision: z.number().int().nonnegative(),
  deployedRevision: z.number().int().nonnegative(),
  activeRelease: z.string().nullable(),
  activeJob: PublishJobDtoSchema.nullable(),
  lastJob: PublishJobDtoSchema.nullable(),
});

export type PublishJobStatus = z.infer<typeof PublishJobStatusSchema>;
export type PublishTrigger = z.infer<typeof PublishTriggerSchema>;
export type PublishJobDto = z.infer<typeof PublishJobDtoSchema>;
export type DeploymentStateDto = z.infer<typeof DeploymentStateDtoSchema>;
