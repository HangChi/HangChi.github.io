import type {
  DeploymentStateDto,
  LoginRequest,
  PostListResponse,
  PostQuery,
  SessionResponse,
} from '@blog/contracts';

export interface ApiClientLike {
  session(): Promise<SessionResponse>;
  login(input: LoginRequest): Promise<SessionResponse>;
  logout(): Promise<void>;
  listPosts(query?: Partial<PostQuery>): Promise<PostListResponse>;
  deploymentState(): Promise<DeploymentStateDto>;
}

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class HttpApiClient implements ApiClientLike {
  private csrfToken = '';

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (options.body && !(options.body instanceof FormData)) headers.set('content-type', 'application/json');
    if (options.method && !['GET', 'HEAD'].includes(options.method) && this.csrfToken) {
      headers.set('x-csrf-token', this.csrfToken);
    }
    const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ code: 'HTTP_ERROR', message: '请求失败' }));
      throw new ApiError(response.status, payload.code ?? 'HTTP_ERROR', payload.message ?? '请求失败');
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async session(): Promise<SessionResponse> {
    const session = await this.request<SessionResponse>('/api/auth/session');
    this.csrfToken = session.csrfToken || sessionStorage.getItem('blog-cms-csrf') || '';
    return { ...session, csrfToken: this.csrfToken };
  }

  async login(input: LoginRequest): Promise<SessionResponse> {
    const session = await this.request<SessionResponse>('/api/auth/login', {
      method: 'POST', body: JSON.stringify(input),
    });
    this.csrfToken = session.csrfToken;
    sessionStorage.setItem('blog-cms-csrf', session.csrfToken);
    return session;
  }

  async logout(): Promise<void> {
    await this.request<void>('/api/auth/logout', { method: 'POST' });
    this.csrfToken = '';
    sessionStorage.removeItem('blog-cms-csrf');
  }

  listPosts(query: Partial<PostQuery> = {}): Promise<PostListResponse> {
    const parameters = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '' && value !== 'all') parameters.set(key, String(value));
    }
    const suffix = parameters.size ? `?${parameters}` : '';
    return this.request<PostListResponse>(`/api/posts${suffix}`);
  }

  deploymentState(): Promise<DeploymentStateDto> {
    return this.request<DeploymentStateDto>('/api/publishing/state');
  }
}
