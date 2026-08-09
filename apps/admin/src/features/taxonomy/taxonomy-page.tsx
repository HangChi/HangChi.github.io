import type { TaxonomyDto } from '@blog/contracts';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { ApiClientLike, TaxonomyKind } from '../../api/client.js';

function slugify(value: string): string { return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, ''); }

export function TaxonomyPage({ api, kind }: { api: ApiClientLike; kind: TaxonomyKind }) {
  const [items, setItems] = useState<TaxonomyDto[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const title = kind === 'categories' ? '分类' : '标签';
  const load = () => api.listTaxonomy(kind).then(setItems).catch((error) => setMessage(error instanceof Error ? error.message : '载入失败'));
  useEffect(() => { void load(); }, [kind]);
  async function create(): Promise<void> {
    if (!name.trim()) return;
    try { await api.createTaxonomy(kind, { name: name.trim(), slug: slugify(name) }); setName(''); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : '创建失败'); }
  }
  async function remove(id: string): Promise<void> {
    if (!window.confirm(`确定删除这个${title}吗？`)) return;
    try { await api.deleteTaxonomy(kind, id); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : '删除失败'); }
  }
  return <main className="content-page"><header className="page-header"><div><p className="eyebrow">TAXONOMY</p><h1>{title}</h1><p>维护文章的{title}结构。</p></div></header>
    {message && <div className="release-alert is-error">{message}</div>}
    <div className="taxonomy-create"><input aria-label={`${title}名称`} value={name} placeholder={`输入${title}名称`} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void create(); }} /><button className="primary-button" onClick={() => void create()}><Plus size={16} />新建{title}</button></div>
    <div className="taxonomy-list">{items.map((item) => <div key={item.id}><span><b>{item.name}</b><small>/{item.slug}</small></span><button className="icon-button" aria-label={`删除 ${item.name}`} onClick={() => void remove(item.id)}><Trash2 size={16} /></button></div>)}{!items.length && <div className="state-card">还没有{title}</div>}</div>
  </main>;
}
