import { describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import { cookieHeader, createTestAuthService } from '../test/test-auth.js';

function multipartBody(boundary: string): Buffer {
  return Buffer.from([
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="file"; filename="diagram.png"\r\n',
    'Content-Type: image/png\r\n\r\n',
    'PNGDATA\r\n',
    `--${boundary}--\r\n`,
  ].join(''));
}

describe('upload routes', () => {
  it('requires a session and forwards one bounded image', async () => {
    const seen: Array<{ filename: string; mimeType: string; size: number }> = [];
    const app = await buildApp({
      authService: await createTestAuthService(),
      cookieSecure: false,
      imageUploadService: {
        upload: async (file) => {
          seen.push({ filename: file.filename, mimeType: file.mimeType, size: file.data.length });
          return { name: file.filename, url: 'http://115.159.112.148:40066/i/diagram.png' };
        },
      },
    });
    const boundary = 'blog-cms-test-boundary';
    const payload = multipartBody(boundary);

    const unauthorized = await app.inject({
      method: 'POST', url: '/api/uploads/images',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` }, payload,
    });
    expect(unauthorized.statusCode).toBe(401);

    const login = await app.inject({
      method: 'POST', url: '/api/auth/login', payload: { username: 'admin', password: 'correct password' },
    });
    const response = await app.inject({
      method: 'POST', url: '/api/uploads/images',
      headers: {
        cookie: cookieHeader(login.headers['set-cookie']),
        'x-csrf-token': login.json().csrfToken,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload,
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ name: 'diagram.png', url: 'http://115.159.112.148:40066/i/diagram.png' });
    expect(seen).toEqual([{ filename: 'diagram.png', mimeType: 'image/png', size: 7 }]);
  });
});
