# Blog CMS deployment

The public blog remains an nginx-served Astro static site. The CMS API and admin SPA listen only on `127.0.0.1:8790`; access them through an SSH tunnel until a domain and HTTPS are configured.

## Server layout

- `/opt/blog-cms/source`: trusted CMS source checkout
- `/etc/blog-cms/cms.env`: mode `0600`, runtime configuration
- `/var/www/blog-releases`: immutable Astro releases, newest five retained
- `/var/www/blog-current`: symlink nginx serves
- `/var/backups/blog-cms`: daily compressed MySQL backups, retained 14 days

## Install/update

1. Install Node.js 24, pnpm, nginx, and a MySQL 8 client.
2. Build with `pnpm install --frozen-lockfile && pnpm build:admin && pnpm build:cms`.
3. Copy `.env.cms.example` to `/etc/blog-cms/cms.env`, replace placeholders, remove the two `CMS_ADMIN_*` lines, and set mode `0600`.
4. Install the unit files from `ops/systemd`, then run `systemctl daemon-reload`.
5. Create the first administrator once by temporarily exporting `CMS_ADMIN_PASSWORD` and running `pnpm --filter @blog/cms create-admin`.
6. Start with `systemctl enable --now blog-cms blog-cms-backup.timer`.

Never place a database or administrator password in Git, command history, or a systemd unit. Verify with `curl http://127.0.0.1:8790/api/health/ready`.

## Private admin access

From the local computer:

```bash
ssh -L 8790:127.0.0.1:8790 root@39.99.232.157
```

Keep the session open and visit `http://127.0.0.1:8790`. The admin service is not publicly exposed.

## Restore

Stop the CMS, validate the selected backup, restore it into an empty `blog_cms` database, then start the CMS and trigger a site rebuild. Release activation is atomic: a failed build leaves `/var/www/blog-current` pointing at the previous successful release.
