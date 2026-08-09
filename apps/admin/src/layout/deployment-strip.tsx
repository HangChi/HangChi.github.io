import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { ApiClientLike } from '../api/client.js';

export function DeploymentStrip({ api }: { api: ApiClientLike }) {
  const [state, setState] = useState<Awaited<ReturnType<ApiClientLike['deploymentState']>> | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => api.deploymentState().then((value) => { if (active) setState(value); }).catch(() => undefined);
    void load();
    const timer = window.setInterval(load, state?.activeJob ? 2000 : 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [api, state?.activeJob]);
  const synced = state && state.databaseRevision === state.deployedRevision && !state.activeJob;
  return <div className={`deployment-strip ${synced ? 'is-synced' : 'is-pending'}`}>
    <span className="deployment-strip__state">
      {state?.activeJob ? <LoaderCircle className="spin" size={15} /> : synced ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
      {state?.activeJob ? '正在生成静态站点' : synced ? '线上内容已同步' : '有内容等待发布'}
    </span>
    <span>数据库 <b>r{state?.databaseRevision ?? '—'}</b></span>
    <span className="deployment-line" />
    <span>线上 <b>r{state?.deployedRevision ?? '—'}</b></span>
  </div>;
}
