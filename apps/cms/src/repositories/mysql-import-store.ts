import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { normalizeSlug } from '../domain/slug.js';
import type { ImportedPost } from '../services/frontmatter.js';
import type { ImportDisposition, ImportStore } from '../services/importer.js';

type IdRow = RowDataPacket & { id: string | number };
type ExistingRow = RowDataPacket & {
  id: string | number;
  source_hash: string | null;
  version: number;
  status: 'draft' | 'published';
};

async function taxonomyId(connection: PoolConnection, table: 'categories' | 'tags', name: string): Promise<string> {
  const slug = normalizeSlug(name);
  const [rows] = await connection.execute<IdRow[]>(`SELECT id FROM ${table} WHERE slug = ?`, [slug]);
  if (rows[0]) return String(rows[0].id);
  const [result] = await connection.execute<ResultSetHeader>(`INSERT INTO ${table} (name, slug) VALUES (?, ?)`, [name, slug]);
  return String(result.insertId);
}

export class MysqlImportStore implements ImportStore {
  constructor(private readonly pool: Pool) {}

  async upsert(post: ImportedPost): Promise<ImportDisposition> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute<ExistingRow[]>(`
        SELECT id, source_hash, version, status FROM posts WHERE source_path = ? FOR UPDATE
      `, [post.sourcePath]);
      const existing = rows[0];
      if (existing?.source_hash === post.sourceHash) {
        await connection.commit();
        return 'unchanged';
      }

      const categoryId = post.category ? await taxonomyId(connection, 'categories', post.category) : null;
      const tags = [] as Array<{ id: string; name: string; slug: string }>;
      for (const name of [...new Set(post.tags)]) {
        tags.push({ id: await taxonomyId(connection, 'tags', name), name, slug: normalizeSlug(name) });
      }

      let id: string;
      let version: number;
      if (existing) {
        id = String(existing.id);
        version = existing.version + 1;
        await connection.execute(`
          UPDATE posts SET slug = ?, title = ?, description = ?, markdown = ?, status = ?,
            category_id = ?, published_at = ?, pinned = ?, source_extension = ?, source_hash = ?,
            version = ? WHERE id = ?
        `, [
          post.slug, post.title, post.description, post.markdown, post.status, categoryId,
          post.publishedAt, post.pinned, post.sourceExtension, post.sourceHash, version, id,
        ]);
      } else {
        const [result] = await connection.execute<ResultSetHeader>(`
          INSERT INTO posts (
            slug, title, description, markdown, status, category_id, published_at, pinned,
            source_extension, source_path, source_hash
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          post.slug, post.title, post.description, post.markdown, post.status, categoryId,
          post.publishedAt, post.pinned, post.sourceExtension, post.sourcePath, post.sourceHash,
        ]);
        id = String(result.insertId);
        version = 1;
      }

      await connection.execute('DELETE FROM post_tags WHERE post_id = ?', [id]);
      for (const tag of tags) {
        await connection.execute('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)', [id, tag.id]);
      }
      const snapshot = {
        id, slug: post.slug, title: post.title, description: post.description, markdown: post.markdown,
        status: post.status, category: categoryId && post.category
          ? { id: categoryId, name: post.category, slug: normalizeSlug(post.category) }
          : null,
        tags, pinned: post.pinned, publishedAt: post.publishedAt,
        sourceExtension: post.sourceExtension, sourcePath: post.sourcePath, sourceHash: post.sourceHash,
        version, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      };
      await connection.execute(
        'INSERT INTO post_versions (post_id, version, reason, snapshot) VALUES (?, ?, ?, ?)',
        [id, version, 'import', JSON.stringify(snapshot)],
      );
      if (post.status === 'published' || existing?.status === 'published') {
        await connection.execute('UPDATE deployment_state SET database_revision = database_revision + 1 WHERE id = 1');
      }
      await connection.commit();
      return existing ? 'updated' : 'created';
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
