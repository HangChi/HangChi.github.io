import { Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from './auth-provider.js';

export function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (admin) return <Navigate to="/articles" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login({ username, password });
      navigate('/articles', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '登录失败');
    } finally {
      setBusy(false);
    }
  };

  return <main className="login-stage">
    <section className="login-intro" aria-label="博客管理介绍">
      <div className="brand-mark">HC</div>
      <p className="eyebrow">HANGCHI / CONTENT SYSTEM</p>
      <h1>让写作保持专注，<br />让发布有迹可循。</h1>
      <p>文章保存在你的数据库中。每次发布都会生成一个可回滚的 Astro 静态版本。</p>
      <div className="login-orbit" aria-hidden="true"><span /><span /><span /></div>
    </section>
    <section className="login-card">
      <div className="login-card__icon"><LockKeyhole size={22} /></div>
      <p className="eyebrow">PRIVATE CONSOLE</p>
      <h2>登录博客后台</h2>
      <p className="muted">仅限管理员访问</p>
      <form onSubmit={submit}>
        <label>用户名<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        <label>密码<span className="password-field">
          <input autoComplete="current-password" type={visible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="button" className="icon-button" aria-label={visible ? '隐藏密码' : '显示密码'} onClick={() => setVisible((value) => !value)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        </span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button login-submit" disabled={busy} type="submit">
          {busy && <LoaderCircle className="spin" size={16} />}登录
        </button>
      </form>
      <p className="login-hint">通过 SSH 安全通道访问</p>
    </section>
  </main>;
}
