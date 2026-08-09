import type { TaxonomyDto, TaxonomyInput } from '@blog/contracts';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export type TaxonomyKind = 'categories' | 'tags';

export interface TaxonomyRepository {
  list(kind: TaxonomyKind): Promise<TaxonomyDto[]>;
  create(kind: TaxonomyKind, input: TaxonomyInput): Promise<TaxonomyDto>;
  update(kind: TaxonomyKind, id: string, input: TaxonomyInput): Promise<TaxonomyDto>;
  delete(kind: TaxonomyKind, id: string): Promise<void>;
}

type TaxonomyRow = RowDataPacket & { id: string | number; name: string; slug: string };

function table(kind: TaxonomyKind): 'categories' | 'tags' {
  return kind;
}

export class MysqlTaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly pool: Pool) {}

  async list(kind: TaxonomyKind): Promise<TaxonomyDto[]> {
    const [rows] = await this.pool.query<TaxonomyRow[]>(`
      SELECT id, name, slug FROM ${table(kind)} ORDER BY name ASC, id ASC
    `);
    return rows.map((row) => ({ id: String(row.id), name: row.name, slug: row.slug }));
  }

  async create(kind: TaxonomyKind, input: TaxonomyInput): Promise<TaxonomyDto> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO ${table(kind)} (name, slug) VALUES (?, ?)`,
      [input.name, input.slug],
    );
    return { id: String(result.insertId), ...input };
  }

  async update(kind: TaxonomyKind, id: string, input: TaxonomyInput): Promise<TaxonomyDto> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      `UPDATE ${table(kind)} SET name = ?, slug = ? WHERE id = ?`,
      [input.name, input.slug, id],
    );
    if (result.affectedRows !== 1) throw new Error('分类或标签不存在');
    return { id, ...input };
  }

  async delete(kind: TaxonomyKind, id: string): Promise<void> {
    const [result] = await this.pool.execute<ResultSetHeader>(`DELETE FROM ${table(kind)} WHERE id = ?`, [id]);
    if (result.affectedRows !== 1) throw new Error('分类或标签不存在');
  }
}
