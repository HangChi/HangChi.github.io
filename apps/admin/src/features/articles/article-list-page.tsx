import { FilePlus2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import type { PostListResponse } from '@blog/contracts';
import type { ApiClientLike } from '../../api/client.js';

export function ArticleListPage({ api }: { api: ApiClientLike }) {
  const [parameters, setParameters] = useSearchParams();
  const [data, setData] = useState<PostListResponse | null>(null);
  const [error, setError] = useState('');
  const search = parameters.get('search') ?? '';
  const status = parameters.get('status') ?? 'all';
  const page = Math.max(1, Number(parameters.get('page') ?? 1) || 1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api.listPosts({ search, status: status as 'all' | 'draft' | 'published' | 'trash', page })
        .then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : '加载失败'));
    }, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [api, page, search, status]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(parameters);
    value && value !== 'all' ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.delete('page');
    setParameters(next);
  };

  return <main className="content-page">
    <header className="page-header"><div><p className="eyebrow">CONTENT LIBRARY</p><h1>文章</h1><p>管理草稿、已发布内容和线上版本。</p></div><Link className="primary-button" to="/articles/new"><FilePlus2 size={16} />新建文章</Link></header>
    <section className="toolbar">
      <label className="search-field"><Search size={17} /><span className="sr-only">搜索文章</span><input aria-label="搜索文章" value={search} onChange={(event) => update('search', event.target.value)} placeholder="搜索标题、Slug 或摘要" /></label>
      <div className="segmented" aria-label="文章状态">{[['all','全部'],['published','已发布'],['draft','草稿'],['trash','回收站']].map(([value,label]) => <button key={value} className={status === value ? 'active' : ''} onClick={() => update('status', value!)}>{label}</button>)}</div>
    </section>
    {error ? <div className="state-card state-card--error">{error}</div> : !data ? <div className="state-card">正在读取文章…</div> : data.items.length === 0 ? <div className="state-card"><BookOpenEmpty /><h2>这里还没有文章</h2><p>新建第一篇文章，或调整当前筛选条件。</p></div> : <div className="article-table" role="table">
      <div className="article-row article-row--head" role="row"><span>文章</span><span>状态</span><span>分类与标签</span><span>更新时间</span></div>
      {data.items.map((post) => <Link to={`/articles/${post.id}`} className="article-row" role="row" key={post.id}>
        <span><b>{post.title}</b><small>/{post.slug}</small></span>
        <span><i className={`status-dot status-dot--${post.status}`} />{post.status === 'published' ? '已发布' : '草稿'}</span>
        <span>{post.category?.name ?? '未分类'}<small>{post.tags.map((tag) => tag.name).join(' · ') || '无标签'}</small></span>
        <span>{new Date(post.updatedAt).toLocaleString('zh-CN')}</span>
      </Link>)}
      {data.total > data.pageSize && <footer className="pagination">
        <span>共 {data.total} 篇 · 第 {data.page} / {Math.ceil(data.total / data.pageSize)} 页</span>
        <div><button disabled={data.page <= 1} onClick={() => update('page', String(data.page - 1))}>上一页</button><button disabled={data.page >= Math.ceil(data.total / data.pageSize)} onClick={() => update('page', String(data.page + 1))}>下一页</button></div>
      </footer>}
    </div>}
  </main>;
}

function BookOpenEmpty() { return <BookOpenTextIcon />; }
function BookOpenTextIcon() { return <span className="empty-glyph" aria-hidden="true">文</span>; }
