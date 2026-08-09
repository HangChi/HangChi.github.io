import type { PostDto, PostInput, PostVersionDto, TaxonomyDto } from '@blog/contracts';
import { ArrowLeft, CloudUpload, Eye, History, ImagePlus, Save, Send, X } from 'lucide-react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ApiError, type ApiClientLike } from '../../api/client.js';
import { createEditorState, editorReducer, supportsVisualEditing } from './editor-model.js';
import { VisualMarkdownEditor } from './visual-markdown-editor.js';

type EditorMetadata = Omit<PostInput, 'markdown' | 'version'> & {
  categoryId: string | null;
  publishedAt: string | null;
};

const blankPost: EditorMetadata = {
  title: '', slug: '', description: '', status: 'draft' as const, categoryId: null as string | null,
  tagIds: [] as string[], pinned: false, publishedAt: null as string | null, sourceExtension: 'md' as const,
};

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
}

export function ArticleEditorPage({ api }: { api: ApiClientLike }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [metadata, setMetadata] = useState<EditorMetadata>(blankPost);
  const [editor, dispatch] = useReducer(editorReducer, createEditorState({ markdown: '', version: 1 }));
  const [categories, setCategories] = useState<TaxonomyDto[]>([]);
  const [tags, setTags] = useState<TaxonomyDto[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [visualWarning, setVisualWarning] = useState('');
  const [versions, setVersions] = useState<PostVersionDto[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void Promise.all([api.listTaxonomy('categories'), api.listTaxonomy('tags')]).then(([nextCategories, nextTags]) => {
      setCategories(nextCategories); setTags(nextTags);
    }).catch(() => undefined);
    if (!id) return;
    void api.getPost(id).then((post) => {
      setMetadata({
        title: post.title, slug: post.slug, description: post.description, status: post.status,
        categoryId: post.category?.id ?? null, tagIds: post.tags.map((tag) => tag.id), pinned: post.pinned,
        publishedAt: post.publishedAt, sourceExtension: post.sourceExtension,
      });
      dispatch({ type: 'server-loaded', markdown: post.markdown, version: post.version });
    }).catch((error) => setNotice(error instanceof Error ? error.message : '文章载入失败')).finally(() => setLoading(false));
  }, [api, id]);

  const input = useMemo<PostInput>(() => ({ ...metadata, markdown: editor.markdown, version: editor.version }), [metadata, editor.markdown, editor.version]);

  async function save(): Promise<PostDto | null> {
    if (!metadata.title.trim() || !metadata.slug.trim()) { setNotice('请填写标题和链接别名'); return null; }
    setSaving(true); setNotice('');
    try {
      const saved = id ? await api.updatePost(id, input) : await api.createPost(input);
      dispatch({ type: 'save-succeeded', version: saved.version });
      setMetadata((current) => ({ ...current, status: saved.status, publishedAt: saved.publishedAt }));
      setNotice('已保存');
      if (!id) navigate(`/articles/${saved.id}`, { replace: true });
      return saved;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        dispatch({ type: 'save-conflicted' }); setNotice('文章已在其他位置更新，请刷新后合并修改');
      } else setNotice(error instanceof Error ? error.message : '保存失败');
      return null;
    } finally { setSaving(false); }
  }

  async function publish(): Promise<void> {
    const saved = await save();
    if (!saved) return;
    const published = await api.publishPost(saved.id, saved.version);
    dispatch({ type: 'save-succeeded', version: published.version });
    setMetadata((current) => ({ ...current, status: 'published', publishedAt: published.publishedAt }));
    setNotice('已进入发布队列，线上构建完成后自动切换');
  }

  function switchMode(mode: 'source' | 'visual'): void {
    if (mode === 'visual') {
      const support = supportsVisualEditing(editor.markdown, metadata.sourceExtension);
      if (!support.supported) {
        setVisualWarning(`${support.reason} 内容可能在可视化模式中丢失，请继续使用 Markdown 源码模式。`);
        return;
      }
    }
    setVisualWarning(''); dispatch({ type: 'mode-changed', mode });
  }

  async function uploadImage(file: File): Promise<void> {
    try {
      setNotice('正在上传图片…');
      const image = await api.uploadImage(file);
      const markdown = `${editor.markdown}${editor.markdown.endsWith('\n') || !editor.markdown ? '' : '\n\n'}![${file.name}](${image.url})`;
      dispatch({ type: 'markdown-changed', markdown }); setNotice('图片已上传并插入正文');
    } catch (error) { setNotice(error instanceof Error ? error.message : '图片上传失败'); }
  }

  async function toggleVersions(): Promise<void> {
    const opening = !showVersions;
    setShowVersions(opening);
    if (opening && id) {
      try { setVersions(await api.listPostVersions(id)); } catch (error) { setNotice(error instanceof Error ? error.message : '版本历史载入失败'); }
    }
  }

  async function restoreVersion(versionId: string): Promise<void> {
    if (!id || !window.confirm('恢复该版本会创建一个新的当前版本，确定继续吗？')) return;
    try {
      const restored = await api.restorePostVersion(id, versionId, editor.version);
      setMetadata({ title: restored.title, slug: restored.slug, description: restored.description, status: restored.status, categoryId: restored.category?.id ?? null, tagIds: restored.tags.map((tag) => tag.id), pinned: restored.pinned, publishedAt: restored.publishedAt, sourceExtension: restored.sourceExtension });
      dispatch({ type: 'server-loaded', markdown: restored.markdown, version: restored.version });
      setNotice('已恢复为所选历史版本'); setShowVersions(false);
    } catch (error) { setNotice(error instanceof Error ? error.message : '版本恢复失败'); }
  }

  if (loading) return <main className="content-page"><div className="state-card">正在载入文章…</div></main>;

  return <main className="editor-page">
    <header className="editor-header">
      <Link to="/articles" className="icon-button" aria-label="返回文章列表"><ArrowLeft size={18} /></Link>
      <div className="editor-title-field">
        <input aria-label="文章标题" value={metadata.title} placeholder="请输入标题" onChange={(event) => setMetadata((value) => ({ ...value, title: event.target.value, slug: value.slug || slugify(event.target.value) }))} />
        <span>{editor.dirty ? '尚未保存' : notice || '所有更改已保存'}</span>
      </div>
      <div className="editor-actions">
        <button className="secondary-button" onClick={() => void save()} disabled={saving}><Save size={16} />保存</button>
        <button className="primary-button" onClick={() => void publish()} disabled={saving}><Send size={16} />发布</button>
      </div>
    </header>

    {notice && <div className={`editor-notice${editor.conflict ? ' is-error' : ''}`}>{notice}<button aria-label="关闭提示" onClick={() => setNotice('')}><X size={14} /></button></div>}
    <div className="editor-workspace">
      <section className="editor-canvas">
        <div className="editor-toolbar">
          <div className="segmented"><button className={editor.mode === 'source' ? 'active' : ''} onClick={() => switchMode('source')}>Markdown</button><button className={editor.mode === 'visual' ? 'active' : ''} onClick={() => switchMode('visual')}>可视化</button></div>
          <button className="secondary-button" onClick={() => imageInput.current?.click()}><ImagePlus size={16} />图片</button>
          <input ref={imageInput} hidden type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} />
        </div>
        {visualWarning && <div className="editor-warning">{visualWarning}</div>}
        {editor.mode === 'source'
          ? <textarea aria-label="Markdown 正文" className="source-editor" value={editor.markdown} onChange={(event) => dispatch({ type: 'markdown-changed', markdown: event.target.value })} spellCheck={false} />
          : <VisualMarkdownEditor value={editor.markdown} onChange={(markdown) => dispatch({ type: 'markdown-changed', markdown })} />}
      </section>

      <aside className="editor-settings">
        <p className="eyebrow">ARTICLE DETAILS</p><h2>文章设置</h2>
        <label>链接别名<input value={metadata.slug} onChange={(event) => setMetadata((value) => ({ ...value, slug: slugify(event.target.value) }))} /></label>
        <label>摘要<textarea rows={4} value={metadata.description} onChange={(event) => setMetadata((value) => ({ ...value, description: event.target.value }))} /></label>
        <label>分类<select value={metadata.categoryId ?? ''} onChange={(event) => setMetadata((value) => ({ ...value, categoryId: event.target.value || null }))}><option value="">未分类</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <fieldset><legend>标签</legend><div className="tag-options">{tags.map((tag) => <label key={tag.id}><input type="checkbox" checked={metadata.tagIds.includes(tag.id)} onChange={(event) => setMetadata((value) => ({ ...value, tagIds: event.target.checked ? [...value.tagIds, tag.id] : value.tagIds.filter((item) => item !== tag.id) }))} />{tag.name}</label>)}</div></fieldset>
        <label className="check-row"><input type="checkbox" checked={metadata.pinned} onChange={(event) => setMetadata((value) => ({ ...value, pinned: event.target.checked }))} />置顶文章</label>
        <div className="editor-meta"><span><CloudUpload size={14} />{metadata.status === 'published' ? '已发布' : '草稿'}</span><span><Eye size={14} />版本 {editor.version}</span></div>
        {!isNew && <button className="secondary-button version-toggle" onClick={() => void toggleVersions()}><History size={15} />版本历史</button>}
        {showVersions && <div className="version-list">{versions.map((item) => <button key={item.id} onClick={() => void restoreVersion(item.id)}><b>v{item.version} · {item.reason}</b><small>{new Date(item.createdAt).toLocaleString('zh-CN')}</small></button>)}{!versions.length && <p>暂无历史版本</p>}</div>}
      </aside>
    </div>
  </main>;
}
