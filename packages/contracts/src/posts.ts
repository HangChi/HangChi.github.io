import { z } from 'zod';

export const EntityIdSchema = z.coerce.string().regex(/^[1-9]\d*$/);
export const PostStatusSchema = z.enum(['draft', 'published']);
export const DeploymentStatusSchema = z.enum(['not-deployed', 'pending', 'deployed', 'failed']);
export const SourceExtensionSchema = z.enum(['md', 'mdx']);

export const SlugSchema = z.string()
  .trim()
  .min(1)
  .max(191)
  .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, 'Slug 只能包含文字、数字和连字符');

export const PostInputSchema = z.object({
  title: z.string().trim().min(1).max(255),
  slug: SlugSchema,
  description: z.string().trim().max(1000).default(''),
  markdown: z.string().max(10_000_000),
  status: PostStatusSchema.default('draft'),
  categoryId: EntityIdSchema.nullable().optional(),
  tagIds: z.array(EntityIdSchema).max(100).default([]),
  pinned: z.boolean().default(false),
  publishedAt: z.string().datetime().nullable().optional(),
  sourceExtension: SourceExtensionSchema.default('md'),
  sourcePath: z.string().max(1024).nullable().optional(),
  version: z.number().int().positive().optional(),
});

export const PostQuerySchema = z.object({
  search: z.string().trim().max(255).default(''),
  status: z.enum(['all', 'draft', 'published', 'trash']).default('all'),
  categoryId: EntityIdSchema.optional(),
  tagId: EntityIdSchema.optional(),
  sort: z.enum(['updated-desc', 'published-desc', 'title-asc']).default('updated-desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const TaxonomyDtoSchema = z.object({
  id: EntityIdSchema,
  name: z.string(),
  slug: z.string(),
});

export const TaxonomyInputSchema = z.object({
  name: z.string().trim().min(1).max(191),
  slug: SlugSchema,
});

export const PostDtoSchema = z.object({
  id: EntityIdSchema,
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  markdown: z.string(),
  status: PostStatusSchema,
  category: TaxonomyDtoSchema.nullable(),
  tags: z.array(TaxonomyDtoSchema),
  pinned: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  sourceExtension: SourceExtensionSchema,
  sourcePath: z.string().nullable(),
  version: z.number().int().positive(),
  deletedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deploymentStatus: DeploymentStatusSchema,
});

export const PostListResponseSchema = z.object({
  items: z.array(PostDtoSchema.omit({ markdown: true })),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export const PostVersionDtoSchema = z.object({
  id: EntityIdSchema,
  postId: EntityIdSchema,
  version: z.number().int().positive(),
  title: z.string(),
  markdown: z.string(),
  reason: z.enum(['create', 'save', 'publish', 'unpublish', 'delete', 'restore', 'import', 'restore-version']),
  createdAt: z.string().datetime(),
});

export type PostStatus = z.infer<typeof PostStatusSchema>;
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;
export type PostInput = z.infer<typeof PostInputSchema>;
export type PostQuery = z.infer<typeof PostQuerySchema>;
export type PostDto = z.infer<typeof PostDtoSchema>;
export type PostListResponse = z.infer<typeof PostListResponseSchema>;
export type PostVersionDto = z.infer<typeof PostVersionDtoSchema>;
export type TaxonomyDto = z.infer<typeof TaxonomyDtoSchema>;
export type TaxonomyInput = z.infer<typeof TaxonomyInputSchema>;
