import type { PostInput, PostQuery, PostStatus } from '@blog/contracts';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import {
  PostVersionConflictError,
  type PostPage,
  type PostRepository,
  type PostVersion,
  type PublishedSnapshot,
  type StoredPost,
  type VersionReason,
} from './types.js';

type Queryable = Pool | PoolConnection;

type PostRow = RowDataPacket & {
  id: string | number;
  slug: string;
  title: string;
  description: string;
  markdown: string;
  status: PostStatus;
  category_id: string | number | null;
  category_name: string | null;
  category_slug: string | null;
  published_at: Date | null;
  pinned: number | boolean;
  source_extension: 'md' | 'mdx';
  source_path: string | null;
  source_hash: string | null;
  version: number;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type TagRow = RowDataPacket & { id: string | number; name: string; slug: string };
type CountRow = RowDataPacket & { total: number };
type RevisionRow = RowDataPacket & { database_revision: string | number };
type VersionRow = RowDataPacket & {
  id: string | number;
  post_id: string | number;
  version: number;
  reason: VersionReason;
  snapshot: string | StoredPost;
  created_at: Date;
};

const postSelect = `
  SELECT p.id, p.slug, p.title, p.description, p.markdown, p.status,
    p.category_id, c.name AS category_name, c.slug AS category_slug,
    p.published_at, p.pinned, p.source_extension, p.source_path, p.source_hash,
    p.version, p.deleted_at, p.created_at, p.updated_at
  FROM posts p
  LEFT JOIN categories c ON c.id = p.category_id
`;

function mapPost(row: PostRow, tags: StoredPost['tags']): StoredPost {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description,
    markdown: row.markdown,
    status: row.status,
    category: row.category_id === null ? null : {
      id: String(row.category_id),
      name: row.category_name ?? '',
      slug: row.category_slug ?? '',
    },
    tags,
    pinned: Boolean(row.pinned),
    publishedAt: row.published_at,
    sourceExtension: row.source_extension,
    sourcePath: row.source_path,
    sourceHash: row.source_hash,
    version: row.version,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseSnapshot(value: string | StoredPost): StoredPost {
  const parsed = typeof value === 'string' ? JSON.parse(value) as StoredPost : value;
  return {
    ...parsed,
    publishedAt: parsed.publishedAt ? new Date(parsed.publishedAt) : null,
    deletedAt: parsed.deletedAt ? new Date(parsed.deletedAt) : null,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
  };
}

export class MysqlPostRepository implements PostRepository {
  constructor(private readonly pool: Pool) {}

  private async tagsFor(queryable: Queryable, postId: string): Promise<StoredPost['tags']> {
    const [rows] = await queryable.execute<TagRow[]>(`
      SELECT t.id, t.name, t.slug
      FROM tags t
      INNER JOIN post_tags pt ON pt.tag_id = t.id
      WHERE pt.post_id = ?
      ORDER BY t.name ASC
    `, [postId]);
    return rows.map((row) => ({ id: String(row.id), name: row.name, slug: row.slug }));
  }

  private async hydrateRows(queryable: Queryable, rows: PostRow[]): Promise<StoredPost[]> {
    return Promise.all(rows.map(async (row) => mapPost(row, await this.tagsFor(queryable, String(row.id)))));
  }

  private async findWith(queryable: Queryable, id: string, includeDeleted: boolean, forUpdate = false): Promise<StoredPost | null> {
    const deletedClause = includeDeleted ? '' : 'AND p.deleted_at IS NULL';
    const lockClause = forUpdate ? 'FOR UPDATE' : '';
    const [rows] = await queryable.execute<PostRow[]>(`${postSelect} WHERE p.id = ? ${deletedClause} ${lockClause}`, [id]);
    const [post] = await this.hydrateRows(queryable, rows);
    return post ?? null;
  }

  async findById(id: string, includeDeleted = false): Promise<StoredPost | null> {
    return this.findWith(this.pool, id, includeDeleted);
  }

  async list(query: PostQuery): Promise<PostPage> {
    const where: string[] = [];
    const parameters: Array<string | number> = [];

    if (query.status === 'trash') {
      where.push('p.deleted_at IS NOT NULL');
    } else {
      where.push('p.deleted_at IS NULL');
      if (query.status !== 'all') {
        where.push('p.status = ?');
        parameters.push(query.status);
      }
    }
    if (query.categoryId) {
      where.push('p.category_id = ?');
      parameters.push(query.categoryId);
    }
    if (query.tagId) {
      where.push('EXISTS (SELECT 1 FROM post_tags filtered_tags WHERE filtered_tags.post_id = p.id AND filtered_tags.tag_id = ?)');
      parameters.push(query.tagId);
    }
    if (query.search) {
      where.push('(p.title LIKE ? OR p.slug LIKE ? OR p.description LIKE ?)');
      const pattern = `%${query.search.replace(/[\\%_]/g, '\\$&')}%`;
      parameters.push(pattern, pattern, pattern);
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;
    const orderSql = {
      'updated-desc': 'p.updated_at DESC, p.id DESC',
      'published-desc': 'p.published_at DESC, p.id DESC',
      'title-asc': 'p.title ASC, p.id ASC',
    }[query.sort];
    const offset = (query.page - 1) * query.pageSize;

    const [countRows] = await this.pool.execute<CountRow[]>(`SELECT COUNT(*) AS total FROM posts p ${whereSql}`, parameters);
    const [rows] = await this.pool.query<PostRow[]>(`${postSelect} ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`, [
      ...parameters,
      query.pageSize,
      offset,
    ]);

    return {
      items: await this.hydrateRows(this.pool, rows),
      total: Number(countRows[0]?.total ?? 0),
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  private async replaceTags(connection: PoolConnection, postId: string, tagIds: string[]): Promise<void> {
    await connection.execute('DELETE FROM post_tags WHERE post_id = ?', [postId]);
    for (const tagId of [...new Set(tagIds)]) {
      await connection.execute('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
    }
  }

  private async saveVersion(connection: PoolConnection, post: StoredPost, reason: VersionReason): Promise<void> {
    await connection.execute(
      'INSERT INTO post_versions (post_id, version, reason, snapshot) VALUES (?, ?, ?, ?)',
      [post.id, post.version, reason, JSON.stringify(post)],
    );
    await connection.execute(`
      DELETE FROM post_versions
      WHERE post_id = ? AND id NOT IN (
        SELECT id FROM (
          SELECT id FROM post_versions WHERE post_id = ? ORDER BY version DESC LIMIT 50
        ) retained
      )
    `, [post.id, post.id]);
  }

  private async incrementRevision(connection: PoolConnection): Promise<void> {
    await connection.execute('UPDATE deployment_state SET database_revision = database_revision + 1 WHERE id = 1');
  }

  async create(input: PostInput, reason: VersionReason = 'create'): Promise<StoredPost> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const publishedAt = input.status === 'published' ? new Date(input.publishedAt ?? Date.now()) : null;
      const [result] = await connection.execute<ResultSetHeader>(`
        INSERT INTO posts (
          slug, title, description, markdown, status, category_id, published_at,
          pinned, source_extension, source_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        input.slug,
        input.title,
        input.description,
        input.markdown,
        input.status,
        input.categoryId ?? null,
        publishedAt,
        input.pinned,
        input.sourceExtension,
        input.sourcePath ?? null,
      ]);
      const id = String(result.insertId);
      await this.replaceTags(connection, id, input.tagIds);
      const post = await this.findWith(connection, id, false, true);
      if (!post) throw new Error('创建文章后无法读取文章');
      await this.saveVersion(connection, post, reason);
      if (post.status === 'published') await this.incrementRevision(connection);
      await connection.commit();
      return post;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async update(id: string, input: PostInput, reason: VersionReason = 'save'): Promise<StoredPost> {
    if (!input.version) throw new PostVersionConflictError();
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const before = await this.findWith(connection, id, false, true);
      if (!before || before.version !== input.version) throw new PostVersionConflictError();
      const publishedAt = input.status === 'published'
        ? new Date(input.publishedAt ?? before.publishedAt ?? Date.now())
        : null;
      const [result] = await connection.execute<ResultSetHeader>(`
        UPDATE posts
        SET title = ?, slug = ?, description = ?, markdown = ?, status = ?,
          category_id = ?, pinned = ?, published_at = ?, source_extension = ?,
          source_path = ?, version = version + 1
        WHERE id = ? AND version = ? AND deleted_at IS NULL
      `, [
        input.title,
        input.slug,
        input.description,
        input.markdown,
        input.status,
        input.categoryId ?? null,
        input.pinned,
        publishedAt,
        input.sourceExtension,
        input.sourcePath ?? before.sourcePath,
        id,
        input.version,
      ]);
      if (result.affectedRows !== 1) throw new PostVersionConflictError();
      await this.replaceTags(connection, id, input.tagIds);
      const post = await this.findWith(connection, id, false, true);
      if (!post) throw new Error('更新文章后无法读取文章');
      await this.saveVersion(connection, post, reason);
      if (before.status === 'published' || post.status === 'published') await this.incrementRevision(connection);
      await connection.commit();
      return post;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private async setDeleted(id: string, expectedVersion: number, deleted: boolean): Promise<StoredPost> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const before = await this.findWith(connection, id, true, true);
      if (!before || before.version !== expectedVersion) throw new PostVersionConflictError();
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE posts SET deleted_at = ${deleted ? 'CURRENT_TIMESTAMP(3)' : 'NULL'}, version = version + 1 WHERE id = ? AND version = ?`,
        [id, expectedVersion],
      );
      if (result.affectedRows !== 1) throw new PostVersionConflictError();
      const post = await this.findWith(connection, id, true, true);
      if (!post) throw new Error('更改回收站状态后无法读取文章');
      await this.saveVersion(connection, post, deleted ? 'delete' : 'restore');
      if (post.status === 'published') await this.incrementRevision(connection);
      await connection.commit();
      return post;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  softDelete(id: string, expectedVersion: number): Promise<StoredPost> {
    return this.setDeleted(id, expectedVersion, true);
  }

  restore(id: string, expectedVersion: number): Promise<StoredPost> {
    return this.setDeleted(id, expectedVersion, false);
  }

  async permanentlyDelete(id: string): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const post = await this.findWith(connection, id, true, true);
      if (!post?.deletedAt) throw new Error('只有回收站中的文章可以永久删除');
      await connection.execute('DELETE FROM posts WHERE id = ?', [id]);
      if (post.status === 'published') await this.incrementRevision(connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async listVersions(id: string, limit = 50): Promise<PostVersion[]> {
    const safeLimit = Math.max(1, Math.min(100, limit));
    const [rows] = await this.pool.query<VersionRow[]>(`
      SELECT id, post_id, version, reason, snapshot, created_at
      FROM post_versions WHERE post_id = ? ORDER BY version DESC LIMIT ?
    `, [id, safeLimit]);
    return rows.map((row) => ({
      id: String(row.id),
      postId: String(row.post_id),
      version: row.version,
      reason: row.reason,
      snapshot: parseSnapshot(row.snapshot),
      createdAt: row.created_at,
    }));
  }

  async restoreVersion(id: string, versionId: string, expectedVersion: number): Promise<StoredPost> {
    const [rows] = await this.pool.execute<VersionRow[]>(`
      SELECT id, post_id, version, reason, snapshot, created_at
      FROM post_versions WHERE id = ? AND post_id = ?
    `, [versionId, id]);
    const row = rows[0];
    if (!row) throw new Error('文章版本不存在');
    const snapshot = parseSnapshot(row.snapshot);
    return this.update(id, {
      title: snapshot.title,
      slug: snapshot.slug,
      description: snapshot.description,
      markdown: snapshot.markdown,
      status: snapshot.status,
      categoryId: snapshot.category?.id ?? null,
      tagIds: snapshot.tags.map((tag) => tag.id),
      pinned: snapshot.pinned,
      publishedAt: snapshot.publishedAt?.toISOString() ?? null,
      sourceExtension: snapshot.sourceExtension,
      sourcePath: snapshot.sourcePath,
      version: expectedVersion,
    }, 'restore-version');
  }

  async snapshotPublished(): Promise<PublishedSnapshot> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [revisionRows] = await connection.query<RevisionRow[]>('SELECT database_revision FROM deployment_state WHERE id = 1');
      const [rows] = await connection.query<PostRow[]>(`${postSelect} WHERE p.status = 'published' AND p.deleted_at IS NULL ORDER BY p.id ASC`);
      const posts = await this.hydrateRows(connection, rows);
      await connection.commit();
      return { revision: Number(revisionRows[0]?.database_revision ?? 0), posts };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
