import { describe, expect, it } from 'vitest';

import { EasyImageService } from './easyimage-service.js';

const png = {
  filename: 'diagram.png',
  mimeType: 'image/png',
  data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
};

describe('EasyImageService', () => {
  it('returns only the safe public fields from a successful upload', async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({
      code: 200,
      url: 'http://115.159.112.148:40066/i/2026/08/diagram.png',
      srcName: 'diagram.png',
      del: 'http://115.159.112.148:40066/delete/private-token',
      thumb: 'http://115.159.112.148:40066/thumb.png',
    }), { status: 200, headers: { 'content-type': 'application/json' } });
    const service = new EasyImageService('http://115.159.112.148:40066', fetcher);

    await expect(service.upload(png)).resolves.toEqual({
      name: 'diagram.png',
      url: 'http://115.159.112.148:40066/i/2026/08/diagram.png',
    });
  });

  it('rejects a successful response that points at another host', async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({
      code: 200, url: 'javascript:alert(1)', srcName: 'diagram.png',
    }));
    const service = new EasyImageService('http://115.159.112.148:40066', fetcher);
    await expect(service.upload(png)).rejects.toThrow('图片地址无效');
  });

  it('rejects unsupported input before contacting the image host', async () => {
    const fetcher: typeof fetch = async () => { throw new Error('must not be called'); };
    const service = new EasyImageService('http://115.159.112.148:40066', fetcher);
    await expect(service.upload({ ...png, mimeType: 'text/html' })).rejects.toThrow('不支持的图片类型');
  });
});
