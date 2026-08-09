import type { AdminIdentity, LoginRequest } from '@blog/contracts';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { ApiClientLike } from '../../api/client.js';

type AuthContextValue = {
  admin: AdminIdentity | null;
  checking: boolean;
  login(input: LoginRequest): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ api, children }: { api: ApiClientLike; children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    api.session()
      .then((session) => { if (active) setAdmin(session.admin); })
      .catch(() => { if (active) setAdmin(null); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [api]);

  const value = useMemo<AuthContextValue>(() => ({
    admin,
    checking,
    login: async (input) => { const session = await api.login(input); setAdmin(session.admin); },
    logout: async () => { await api.logout(); setAdmin(null); },
  }), [admin, api, checking]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth 必须在 AuthProvider 中使用');
  return value;
}
