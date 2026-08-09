const allowedMimeTypes = new Set([
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const maxImageBytes = 10 * 1024 * 1024;
const maxResponseBytes = 64 * 1024;

export type ImageUpload = {
  filename: string;
  mimeType: string;
  data: Buffer;
};

export type UploadedImage = {
  name: string;
  url: string;
};

export class EasyImageService {
  private readonly baseUrl: URL;

  constructor(baseUrl: string, private readonly fetcher: typeof fetch = fetch) {
    this.baseUrl = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    if (!['http:', 'https:'].includes(this.baseUrl.protocol)) {
      throw new Error('EasyImage 地址必须使用 HTTP 或 HTTPS');
    }
  }

  async upload(file: ImageUpload): Promise<UploadedImage> {
    if (!allowedMimeTypes.has(file.mimeType)) throw new Error('不支持的图片类型');
    if (file.data.length === 0) throw new Error('图片内容为空');
    if (file.data.length > maxImageBytes) throw new Error('图片不能超过 10 MiB');

    const filename = file.filename.split(/[\\/]/).pop()?.slice(0, 255) || 'image';
    const body = new FormData();
    body.append('file', new Blob([Uint8Array.from(file.data)], { type: file.mimeType }), filename);
    body.append('sign', String(Math.floor(Date.now() / 1000)));

    const response = await this.fetcher(new URL('app/upload.php', this.baseUrl), {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error('图床暂时无法完成上传');
    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > maxResponseBytes) throw new Error('图床返回内容异常');

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error('图床返回内容异常');
    }
    if (!payload || typeof payload !== 'object') throw new Error('图床返回内容异常');
    const value = payload as Record<string, unknown>;
    if (value.code !== 200 || typeof value.url !== 'string' || typeof value.srcName !== 'string') {
      const message = typeof value.message === 'string' ? value.message.slice(0, 300) : '图床上传失败';
      throw new Error(message);
    }

    let publicUrl: URL;
    try {
      publicUrl = new URL(value.url);
    } catch {
      throw new Error('图床返回的图片地址无效');
    }
    if (!['http:', 'https:'].includes(publicUrl.protocol)
      || publicUrl.hostname !== this.baseUrl.hostname
      || publicUrl.port !== this.baseUrl.port) {
      throw new Error('图床返回的图片地址无效');
    }

    return {
      name: value.srcName.split(/[\\/]/).pop()?.slice(0, 255) || filename,
      url: publicUrl.toString(),
    };
  }
}
