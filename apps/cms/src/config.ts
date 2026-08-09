import { z } from 'zod';

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CMS_HOST: z.string().default('127.0.0.1'),
  CMS_PORT: z.coerce.number().int().min(1).max(65_535).default(8790),
  CMS_DATABASE_URL: z.string().url(),
  CMS_COOKIE_SECURE: z.stringbool().default(false),
  CMS_SESSION_HOURS: z.coerce.number().positive().max(168).default(12),
  EASYIMAGE_BASE_URL: z.string().url().default('http://115.159.112.148:40066'),
  CMS_SOURCE_ROOT: z.string().default(process.cwd()),
  CMS_RELEASES_ROOT: z.string().default('.cms-releases'),
  CMS_ACTIVE_LINK: z.string().default('.cms-active'),
  CMS_PACKAGE_MANAGER_COMMAND: z.string().min(1).default('pnpm'),
  CMS_ADMIN_DIST: z.string().default('apps/admin/dist'),
  CMS_REMOTE_DEPLOY_HOST: z.string().optional(),
  CMS_REMOTE_DEPLOY_PORT: z.coerce.number().int().min(1).max(65_535).default(22),
  CMS_REMOTE_DEPLOY_USER: z.string().default('blogdeploy'),
  CMS_REMOTE_DEPLOY_IDENTITY: z.string().default('/etc/blog-cms/deploy_key'),
  CMS_REMOTE_KNOWN_HOSTS: z.string().default('/etc/blog-cms/known_hosts'),
  CMS_REMOTE_BLOG_ROOT: z.string().default('/var/www/hangchi-blog'),
});

export type CmsConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  host: string;
  port: number;
  databaseUrl: string;
  cookieSecure: boolean;
  sessionHours: number;
  easyImageBaseUrl: string;
  sourceRoot: string;
  releasesRoot: string;
  activeLink: string;
  packageManagerCommand: string;
  adminDist: string;
  remoteDeploy: null | { host: string; port: number; user: string; identityFile: string; knownHostsFile: string; root: string };
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
    sourceRoot: parsed.CMS_SOURCE_ROOT,
    releasesRoot: parsed.CMS_RELEASES_ROOT,
    activeLink: parsed.CMS_ACTIVE_LINK,
    packageManagerCommand: parsed.CMS_PACKAGE_MANAGER_COMMAND,
    adminDist: parsed.CMS_ADMIN_DIST,
    remoteDeploy: parsed.CMS_REMOTE_DEPLOY_HOST ? {
      host: parsed.CMS_REMOTE_DEPLOY_HOST,
      port: parsed.CMS_REMOTE_DEPLOY_PORT,
      user: parsed.CMS_REMOTE_DEPLOY_USER,
      identityFile: parsed.CMS_REMOTE_DEPLOY_IDENTITY,
      knownHostsFile: parsed.CMS_REMOTE_KNOWN_HOSTS,
      root: parsed.CMS_REMOTE_BLOG_ROOT,
    } : null,
  };
}
