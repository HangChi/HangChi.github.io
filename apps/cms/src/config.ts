import { z } from 'zod';

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CMS_HOST: z.string().default('127.0.0.1'),
  CMS_PORT: z.coerce.number().int().min(1).max(65_535).default(8790),
  CMS_DATABASE_URL: z.string().url(),
  CMS_COOKIE_SECURE: z.stringbool().default(false),
  CMS_SESSION_HOURS: z.coerce.number().positive().max(168).default(12),
  EASYIMAGE_BASE_URL: z.string().url().default('http://115.159.112.148:40066'),
});

export type CmsConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  host: string;
  port: number;
  databaseUrl: string;
  cookieSecure: boolean;
  sessionHours: number;
  easyImageBaseUrl: string;
};

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): CmsConfig {
  const parsed = ConfigSchema.parse(environment);
  return {
    nodeEnv: parsed.NODE_ENV,
    host: parsed.CMS_HOST,
    port: parsed.CMS_PORT,
    databaseUrl: parsed.CMS_DATABASE_URL,
    cookieSecure: parsed.CMS_COOKIE_SECURE,
    sessionHours: parsed.CMS_SESSION_HOURS,
    easyImageBaseUrl: parsed.EASYIMAGE_BASE_URL.replace(/\/$/, ''),
  };
}
