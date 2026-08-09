import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';

import { requireCsrf, requireSession } from '../plugins/auth.js';
import type { AuthService } from '../services/auth-service.js';
import type { ImageUpload, UploadedImage } from '../services/easyimage-service.js';

export interface ImageUploadService {
  upload(file: ImageUpload): Promise<UploadedImage>;
}

export async function registerUploadRoutes(
  app: FastifyInstance,
  options: { authService: AuthService; imageUploadService: ImageUploadService },
): Promise<void> {
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2, parts: 3 },
  });

  app.post('/api/uploads/images', async (request, reply) => {
    const session = await requireSession(request, options.authService);
    requireCsrf(request, options.authService, session);
    const part = await request.file();
    if (!part) return reply.status(400).send({ code: 'IMAGE_REQUIRED', message: '请选择一张图片' });
    const result = await options.imageUploadService.upload({
      filename: part.filename,
      mimeType: part.mimetype,
      data: await part.toBuffer(),
    });
    return reply.status(201).send(result);
  });
}
