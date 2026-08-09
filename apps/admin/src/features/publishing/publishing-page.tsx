import type { DeploymentStateDto, PublishJobDto } from '@blog/contracts';
import { CircleCheck, Clock3, RefreshCw, Rocket, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { ApiClientLike } from '../../api/client.js';

const statusText: Record<PublishJobDto['status'], string> = {
  queued: '等待中', running: '构建中', succeeded: '成功', failed: '失败',
};

export function PublishingPage({ api }: { api: ApiClientLike }) {
  const [state, setState] = useState<DeploymentStateDto | null>(null);
  const [jobs, setJobs] = useState<PublishJobDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [nextState, nextJobs] = await Promise.all([api.deploymentState(), api.listPublishJobs()]);
      setState(nextState); setJobs(nextJobs); setError('');
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : '发布记录载入失败'); }
  }, [api]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!state?.activeJob) return;
    const timer = window.setInterval(() => void load(), 2500);
    return () => window.clearInterval(timer);
  }, [load, state?.activeJob]);

  async function run(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    try { await action(); await load(); } catch (actionError) { setError(actionError instanceof Error ? actionError.message : '操作失败'); }
    finally { setBusy(false); }
  }

  const failed = state?.lastJob?.status === 'failed';
  return <main className="content-page">
    <header className="page-header"><div><p className="eyebrow">RELEASE PIPELINE</p><h1>发布中心</h1><p>每次发布都先构建并验证，再原子切换线上目录。</p></div><button className="primary-button" disabled={busy || Boolean(state?.activeJob)} onClick={() => void run(() => api.publishSite())}><Rocket size={16} />重新构建站点</button></header>
    {error && <div className="release-alert is-error"><TriangleAlert size={18} /><span>{error}</span></div>}
    {failed && <div className="release-alert is-error"><TriangleAlert size={20} /><div><b>发布失败，线上仍为上一版本</b><p>{state.lastJob?.errorSummary || '构建未通过，未切换线上站点。'}</p></div><button className="secondary-button" disabled={busy} onClick={() => void run(() => api.retryPublishJob(state.lastJob!.id))}><RefreshCw size={15} />重试</button></div>}
    <section className="release-overview">
      <div><span>数据库修订</span><strong>r{state?.databaseRevision ?? '—'}</strong></div>
      <div><span>线上修订</span><strong>r{state?.deployedRevision ?? '—'}</strong></div>
      <div><span>当前版本</span><strong className="release-name">{state?.activeRelease ?? '尚未发布'}</strong></div>
    </section>
    <section className="release-panel"><header><div><p className="eyebrow">HISTORY</p><h2>构建记录</h2></div></header>
      {!jobs.length ? <div className="state-card">暂无发布记录</div> : <div className="release-list">{jobs.map((job) => <article key={job.id} className={`release-job is-${job.status}`}>
        <span className="release-job__icon">{job.status === 'succeeded' ? <CircleCheck size={18} /> : job.status === 'failed' ? <TriangleAlert size={18} /> : <Clock3 size={18} />}</span>
        <div><b>修订 r{job.revision} · {statusText[job.status]}</b><small>{job.trigger} · {new Date(job.queuedAt).toLocaleString('zh-CN')}</small></div>
        <span>{job.releaseName ?? '—'}</span>{job.status === 'failed' && <button className="secondary-button" disabled={busy} onClick={() => void run(() => api.retryPublishJob(job.id))}>重试</button>}
      </article>)}</div>}
    </section>
  </main>;
}
