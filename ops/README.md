# Blog CMS deployment

The public blog remains an nginx-served Astro static site. The CMS API and admin SPA listen only on `127.0.0.1:8790`; access them through an SSH tunnel until a domain and HTTPS are configured.

## Server layout

- `/opt/blog-cms/releases/<timestamp>`: immutable CMS application releases
- `/opt/blog-cms/current`: symlink to the active CMS application release
- `/etc/blog-cms/cms.env`: mode `0600`, runtime configuration
- `/var/lib/blog-cms/releases`: local build workspaces, newest five retained
- `/var/www/hangchi-blog/releases`: immutable releases on the nginx host
- `/var/www/hangchi-blog/current`: symlink nginx serves
- `/var/backups/blog-cms`: daily compressed MySQL backups, retained 14 days
- `/var/lib/blog-cms/github-sync`: dedicated checkout used only to push `src/content/blog`

## Install/update

1. Install Node.js 24, pnpm, nginx, and a MySQL 8 client.
2. Build each new release with `pnpm install --frozen-lockfile && pnpm build:admin && pnpm build:cms`, then atomically update `/opt/blog-cms/current`.
3. Copy `.env.cms.example` to `/etc/blog-cms/cms.env`, replace placeholders, remove the two `CMS_ADMIN_*` lines, and set mode `0600`.
4. Create the protected backup directory with `install -d -m 0700 -o blogcms -g blogcms /var/backups/blog-cms`.
5. Install the unit files from `ops/systemd`, then run `systemctl daemon-reload`.
6. Create the first administrator once by temporarily exporting `CMS_ADMIN_PASSWORD` and running `pnpm --filter @blog/cms create-admin`.
7. Start with `systemctl enable --now blog-cms blog-cms-backup.timer`.

Never place a database or administrator password in Git, command history, or a systemd unit. Verify with `curl http://127.0.0.1:8790/api/health/ready`.

## GitHub Pages content synchronization

When `CMS_GITHUB_SYNC_REPOSITORY` is configured, a successful CMS release copies only the exported `src/content/blog` directory into a dedicated checkout, commits it, and pushes the configured branch. The existing GitHub Pages workflow then builds the new content. Use a repository deploy key with write access, keep its private key readable only by `blogcms`, and use strict host-key checking through `CMS_GITHUB_SYNC_KNOWN_HOSTS`.

## Private admin access

The CMS host uses a dedicated `blogdeploy` SSH account and key to upload verified artifacts to the nginx host; the service never has an interactive root credential. From the local computer:

```bash
ssh -p 2002 -L 8790:127.0.0.1:8790 ubuntu@115.159.112.148
```

Keep the session open and visit `http://127.0.0.1:8790`. The admin service is not publicly exposed.

## Restore

Stop the CMS, validate the selected backup, restore it into an empty `blog_cms` database, then start the CMS and trigger a site rebuild. Release activation is atomic: a failed build leaves `/var/www/blog-current` pointing at the previous successful release.
