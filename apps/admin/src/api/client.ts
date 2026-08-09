import type {
  DeploymentStateDto,
  LoginRequest,
  PostDto,
  PostInput,
  PostListResponse,
  PostQuery,
  PostVersionDto,
  PublishJobDto,
  SessionResponse,
  TaxonomyDto,
  TaxonomyInput,
} from '@blog/contracts';

export type TaxonomyKind = 'categories' | 'tags';
export type UploadedImage = { url: string; filename?: string; width?: number; height?: number };

export interface ApiClientLike {
  session(): Promise<SessionResponse>;
  login(input: LoginRequest): Promise<SessionResponse>;
  logout(): Promise<void>;
  listPosts(query?: Partial<PostQuery>): Promise<PostListResponse>;
  getPost(id: string): Promise<PostDto>;
  createPost(input: PostInput): Promise<PostDto>;
  updatePost(id: string, input: PostInput): Promise<PostDto>;
  publishPost(id: string, version: number): Promise<PostDto>;
  unpublishPost(id: string, version: number): Promise<PostDto>;
  listPostVersions(id: string): Promise<PostVersionDto[]>;
  restorePostVersion(id: string, versionId: string, version: number): Promise<PostDto>;
  uploadImage(file: File): Promise<UploadedImage>;
  listTaxonomy(kind: TaxonomyKind): Promise<TaxonomyDto[]>;
  createTaxonomy(kind: TaxonomyKind, input: TaxonomyInput): Promise<TaxonomyDto>;
  deleteTaxonomy(kind: TaxonomyKind, id: string): Promise<void>;
  deploymentState(): Promise<DeploymentStateDto>;
  listPublishJobs(): Promise<PublishJobDto[]>;
  retryPublishJob(id: string): Promise<void>;
  publishSite(): Promise<void>;
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

  getPost(id: string): Promise<PostDto> {
    return this.request<PostDto>(`/api/posts/${id}`);
  }

  createPost(input: PostInput): Promise<PostDto> {
    return this.request<PostDto>('/api/posts', { method: 'POST', body: JSON.stringify(input) });
  }

  updatePost(id: string, input: PostInput): Promise<PostDto> {
    return this.request<PostDto>(`/api/posts/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  }

  publishPost(id: string, version: number): Promise<PostDto> {
    return this.request<PostDto>(`/api/posts/${id}/publish`, { method: 'POST', body: JSON.stringify({ version }) });
  }

  unpublishPost(id: string, version: number): Promise<PostDto> {
    return this.request<PostDto>(`/api/posts/${id}/unpublish`, { method: 'POST', body: JSON.stringify({ version }) });
  }

  async listPostVersions(id: string): Promise<PostVersionDto[]> {
    return (await this.request<{ items: PostVersionDto[] }>(`/api/posts/${id}/versions`)).items;
  }

  restorePostVersion(id: string, versionId: string, version: number): Promise<PostDto> {
    return this.request<PostDto>(`/api/posts/${id}/versions/${versionId}/restore`, {
      method: 'POST', body: JSON.stringify({ version }),
    });
  }

  uploadImage(file: File): Promise<UploadedImage> {
    const body = new FormData();
    body.set('file', file);
    return this.request<UploadedImage>('/api/uploads/images', { method: 'POST', body });
  }

  async listTaxonomy(kind: TaxonomyKind): Promise<TaxonomyDto[]> {
    return (await this.request<{ items: TaxonomyDto[] }>(`/api/${kind}`)).items;
  }

  createTaxonomy(kind: TaxonomyKind, input: TaxonomyInput): Promise<TaxonomyDto> {
    return this.request<TaxonomyDto>(`/api/${kind}`, { method: 'POST', body: JSON.stringify(input) });
  }

  deleteTaxonomy(kind: TaxonomyKind, id: string): Promise<void> {
    return this.request<void>(`/api/${kind}/${id}`, { method: 'DELETE' });
  }

  deploymentState(): Promise<DeploymentStateDto> {
    return this.request<DeploymentStateDto>('/api/publishing/state');
  }

  async listPublishJobs(): Promise<PublishJobDto[]> {
    return (await this.request<{ items: PublishJobDto[] }>('/api/publishing/jobs')).items;
  }

  async retryPublishJob(id: string): Promise<void> {
    await this.request('/api/publishing/jobs/' + id + '/retry', { method: 'POST' });
  }

  async publishSite(): Promise<void> {
    await this.request('/api/publishing/publish', { method: 'POST' });
  }
}
