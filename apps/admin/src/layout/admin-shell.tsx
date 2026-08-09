import { BookOpenText, FolderTree, Gauge, LogOut, Send, Tags } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import type { ApiClientLike } from '../api/client.js';
import { useAuth } from '../features/auth/auth-provider.js';
import { DeploymentStrip } from './deployment-strip.js';

const links = [
  { to: '/', label: '仪表盘', icon: Gauge, end: true },
  { to: '/articles', label: '文章', icon: BookOpenText },
  { to: '/categories', label: '分类', icon: FolderTree },
  { to: '/tags', label: '标签', icon: Tags },
  { to: '/publishing', label: '发布记录', icon: Send },
];

export function AdminShell({ api }: { api: ApiClientLike }) {
  const { admin, logout } = useAuth();
  return <div className="admin-grid">
    <aside className="sidebar">
      <div className="sidebar-brand"><span className="brand-mark brand-mark--small">HC</span><span><b>HangChi</b><small>Blog Console</small></span></div>
      <nav aria-label="后台导航">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} {...(end ? { end: true } : {})}><Icon size={18} />{label}</NavLink>)}</nav>
      <div className="sidebar-user"><span className="avatar">{admin?.username.slice(0, 1).toUpperCase()}</span><span><b>{admin?.username}</b><small>管理员</small></span><button className="icon-button" aria-label="退出登录" onClick={() => void logout()}><LogOut size={17} /></button></div>
    </aside>
    <div className="workspace">
      <DeploymentStrip api={api} />
      <Outlet />
    </div>
  </div>;
}
