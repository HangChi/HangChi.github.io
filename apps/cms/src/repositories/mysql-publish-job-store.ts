import type { DeploymentStateDto, PublishJobDto, PublishJobStatus, PublishTrigger } from '@blog/contracts';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import type { PublishJobRecord, PublishJobStore } from '../services/publish-queue.js';

type JobRow = RowDataPacket & {
  id: string | number;
  revision: string | number;
  status: PublishJobStatus;
  trigger_name: PublishTrigger;
  release_name: string | null;
  error_summary: string | null;
  execution_log: string;
  queued_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
};

type StateRow = RowDataPacket & {
  database_revision: string | number;
  deployed_revision: string | number;
  active_release: string | null;
};

const selectJob = `
  SELECT id, revision, status, trigger_name, release_name, error_summary,
    execution_log, queued_at, started_at, completed_at
  FROM publish_jobs
`;

function mapJob(row: JobRow): PublishJobRecord {
  return {
    id: String(row.id),
    revision: Number(row.revision),
    status: row.status,
    trigger: row.trigger_name,
    releaseName: row.release_name,
    errorSummary: row.error_summary,
    log: row.execution_log,
    queuedAt: row.queued_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export function publishJobDto(job: PublishJobRecord): PublishJobDto {
  return {
    id: job.id,
    revision: job.revision,
    status: job.status,
    trigger: job.trigger,
    releaseName: job.releaseName,
    errorSummary: job.errorSummary,
    log: job.log,
    queuedAt: job.queuedAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

function boundedLog(value: string): string {
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length <= 1024 * 1024) return value;
  return `${bytes.subarray(bytes.length - 1024 * 1024).toString('utf8')}\n[日志已截断]`;
}

export class MysqlPublishJobStore implements PublishJobStore {
  constructor(private readonly pool: Pool) {}

  async enqueue(trigger: PublishTrigger): Promise<PublishJobRecord> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [stateRows] = await connection.query<StateRow[]>('SELECT database_revision, deployed_revision, active_release FROM deployment_state WHERE id = 1 FOR UPDATE');
      const revision = Number(stateRows[0]?.database_revision ?? 0);
      const [result] = await connection.execute<ResultSetHeader>(`
        INSERT INTO publish_jobs (revision, trigger_name, execution_log) VALUES (?, ?, '')
      `, [revision, trigger]);
      await connection.commit();
      const job = await this.find(String(result.insertId));
      if (!job) throw new Error('创建发布任务后无法读取任务');
      return job;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async claimNext(): Promise<PublishJobRecord | null> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query<JobRow[]>(`${selectJob} WHERE status = 'queued' ORDER BY id ASC LIMIT 1 FOR UPDATE SKIP LOCKED`);
      const row = rows[0];
      if (!row) {
        await connection.commit();
        return null;
      }
      await connection.execute(`UPDATE publish_jobs SET status = 'running', started_at = CURRENT_TIMESTAMP(3) WHERE id = ?`, [row.id]);
      await connection.commit();
      return { ...mapJob(row), status: 'running', startedAt: new Date() };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async find(id: string): Promise<PublishJobRecord | null> {
    const [rows] = await this.pool.execute<JobRow[]>(`${selectJob} WHERE id = ?`, [id]);
    return rows[0] ? mapJob(rows[0]) : null;
  }

  async list(limit = 30): Promise<PublishJobRecord[]> {
    const safeLimit = Math.max(1, Math.min(100, limit));
    const [rows] = await this.pool.execute<JobRow[]>(`${selectJob} ORDER BY id DESC LIMIT ?`, [safeLimit]);
    return rows.map(mapJob);
  }

  async state(): Promise<DeploymentStateDto> {
    const [stateRows] = await this.pool.query<StateRow[]>('SELECT database_revision, deployed_revision, active_release FROM deployment_state WHERE id = 1');
    const [activeRows] = await this.pool.query<JobRow[]>(`${selectJob} WHERE status IN ('queued', 'running') ORDER BY id ASC LIMIT 1`);
    const [lastRows] = await this.pool.query<JobRow[]>(`${selectJob} ORDER BY id DESC LIMIT 1`);
    const state = stateRows[0];
    return {
      databaseRevision: Number(state?.database_revision ?? 0),
      deployedRevision: Number(state?.deployed_revision ?? 0),
      activeRelease: state?.active_release ?? null,
      activeJob: activeRows[0] ? publishJobDto(mapJob(activeRows[0])) : null,
      lastJob: lastRows[0] ? publishJobDto(mapJob(lastRows[0])) : null,
    };
  }

  async markSucceeded(id: string, releaseName: string, revision: number, log: string): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(`
        UPDATE publish_jobs SET status = 'succeeded', release_name = ?, execution_log = ?,
          error_summary = NULL, completed_at = CURRENT_TIMESTAMP(3) WHERE id = ?
      `, [releaseName, boundedLog(log), id]);
      await connection.execute(`
        UPDATE deployment_state SET deployed_revision = ?, active_release = ? WHERE id = 1
      `, [revision, releaseName]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async markFailed(id: string, errorSummary: string, log: string): Promise<void> {
    await this.pool.execute(`
      UPDATE publish_jobs SET status = 'failed', error_summary = ?, execution_log = ?,
        completed_at = CURRENT_TIMESTAMP(3) WHERE id = ?
    `, [errorSummary.slice(0, 1000), boundedLog(log), id]);
  }
}
