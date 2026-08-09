import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';

import type { ApiClientLike } from './api/client.js';
import { ArticleListPage } from './features/articles/article-list-page.js';
import { AuthProvider, useAuth } from './features/auth/auth-provider.js';
import { LoginPage } from './features/auth/login-page.js';
import { AdminShell } from './layout/admin-shell.js';

function Protected({ children }: { children: React.ReactNode }) {
  const { admin, checking } = useAuth();
  if (checking) return <div className="app-loading">正在验证会话…</div>;
  return admin ? children : <Navigate to="/login" replace />;
}

function Placeholder({ title }: { title: string }) {
  return <main className="content-page"><header className="page-header"><div><p className="eyebrow">BLOG CONSOLE</p><h1>{title}</h1></div></header><div className="state-card">功能正在载入</div></main>;
}

function AppRoutes({ api }: { api: ApiClientLike }) {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<Protected><AdminShell api={api} /></Protected>}>
      <Route index element={<Placeholder title="仪表盘" />} />
      <Route path="articles" element={<ArticleListPage api={api} />} />
      <Route path="articles/new" element={<Placeholder title="新建文章" />} />
      <Route path="articles/:id" element={<Placeholder title="编辑文章" />} />
      <Route path="categories" element={<Placeholder title="分类" />} />
      <Route path="tags" element={<Placeholder title="标签" />} />
      <Route path="publishing" element={<Placeholder title="发布记录" />} />
    </Route>
    <Route path="*" element={<Navigate to="/articles" replace />} />
  </Routes>;
}

export function AdminApp({ api, initialEntries }: { api: ApiClientLike; initialEntries?: string[] }) {
  const Router = initialEntries ? MemoryRouter : BrowserRouter;
  const routerProps = initialEntries ? { initialEntries } : {};
  return <Router {...routerProps}><AuthProvider api={api}><AppRoutes api={api} /></AuthProvider></Router>;
}
