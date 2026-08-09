# Personal Blog CMS Design

**Date:** 2026-08-09

## Objective

Build a private, Halo-inspired content management system for the existing Astro blog. The system must let one administrator sign in, browse existing posts, edit posts in visual or Markdown mode, manage metadata, upload images, save drafts, publish, unpublish, restore deleted posts, and inspect publishing failures.

The public blog remains a static Astro site served by nginx. MySQL is the canonical content store. Publishing exports the current published content, builds Astro in an isolated release directory, and atomically activates the new static release.

## Confirmed Constraints

- The CMS is for one administrator; role and permission management are out of scope.
- MySQL runs on the separate database host supplied by the owner.
- A new database named `blog_cms` will be created.
- MySQL root credentials are used only to create the database and a dedicated least-privilege application account.
- The CMS API and publisher run on the existing blog server.
- The admin UI uses both visual editing and Markdown source editing. Markdown is canonical.
- Images are uploaded through the existing EasyImage 2.8.5 service at the owner-provided address. The CMS stores returned URLs, not image binaries.
- A domain and public TLS endpoint are deferred. Until then, the CMS binds to loopback and is accessed through an SSH tunnel.
- Existing Markdown and MDX posts are imported once into MySQL with their metadata and paths preserved.
- The existing public blog layout, routes, SEO behavior, RSS, categories, tags, comments, and static performance remain intact.

## Architecture

The repository gains three focused units alongside the existing Astro application:

1. `apps/admin`: a React single-page application for login, dashboard, article management, editing, preview, and publishing feedback.
2. `apps/cms`: a Node.js API and background publisher. It owns authentication, validation, MySQL access, EasyImage proxying, post versioning, migration, and release orchestration.
3. `packages/contracts`: shared request, response, and domain schemas used by the API and admin application.

The API listens only on `127.0.0.1`. During development the Vite server proxies `/api` to it. In deployment the API serves the built admin assets, and the owner reaches it through an SSH port forward until a domain and valid TLS certificate are configured.

The CMS connects to MySQL using a dedicated application user over an SSH tunnel between the blog server and database server. The publicly reachable MySQL port is not treated as a trusted transport.

## Data Model

### `admin_users`

- One administrator row.
- Normalized username, Argon2id password hash, password-change timestamp, last-login timestamp, created and updated timestamps.
- No plaintext or reversible password material.

### `admin_sessions`

- Stores a SHA-256 hash of a cryptographically random session token, expiry, last-seen time, IP/user-agent audit values, and revocation timestamp.
- The browser receives only the opaque token in an HttpOnly, SameSite=Strict cookie.

### `posts`

- Stable ID, unique slug, title, description, canonical Markdown body, optional editor-state cache, status, category reference, publish timestamp, pinned flag, source extension, original relative path, optimistic-lock version, created/updated timestamps, and soft-delete timestamp.
- Status is `draft` or `published`; the recycle bin is represented by `deleted_at`.
- Public deployment state is stored separately from desired database state so failed builds are visible.

### `post_versions`

- Immutable snapshots of post content and metadata.
- Created on meaningful saves, status changes, restorations, and imports.
- The UI can inspect and restore a version. Retention defaults to the latest 50 versions per post.

### `categories`, `tags`, and `post_tags`

- Categories and tags have unique normalized slugs and display names.
- A post has zero or one category and zero or more tags.
- Existing path-derived categories are preserved during import.

### `publish_jobs`

- Records queued, running, succeeded, and failed jobs.
- Includes the requested revision, trigger, start/end timestamps, release path, bounded execution log, and user-facing error summary.
- Only one job runs at a time. Later requests queue and may reuse a build of the same database revision.

## Authentication and Security

- The first administrator is created by a one-time CLI command using an interactive password prompt or secret environment input; no default password exists.
- Passwords use Argon2id with production parameters.
- Successful login rotates the session token. Logout revokes it server-side.
- State-changing requests require same-origin session cookies and a CSRF token.
- Login endpoints are rate limited and use generic failure messages.
- All request bodies are schema validated, SQL is parameterized, and article paths/slugs are normalized before export.
- API responses never include password hashes, session hashes, database credentials, EasyImage delete tokens, filesystem paths outside intended release metadata, or raw command environments.
- Secrets are loaded from server environment files readable only by the service account.
- The CMS is not exposed over public HTTP. Domain/TLS work is a separate deployment step.

## Admin Experience

### Shell and navigation

The visual language follows the supplied Halo references without copying its product branding. A restrained left navigation rail contains Dashboard, Articles, Categories, Tags, Publishing, and Settings. The content area uses a compact toolbar and high-density tables suited to a personal technical archive.

The distinctive element is a persistent publishing-status strip: it shows the saved database revision, currently deployed revision, active job, and last build result. This makes the static publishing model understandable at a glance.

### Login

- Username and password fields, password visibility toggle, loading state, keyboard submission, and explicit invalid-credential/rate-limit messages.
- No remember-me option in the first release; session expiry is configurable and defaults to 12 hours.

### Article list

- Search title/slug/description.
- Filter by draft/published/recycle bin, category, and tag.
- Sort by updated time, publish time, or title.
- Paginate on the server.
- Show title, status, category, tags, last updated time, public deployment state, and row actions.
- Actions include edit, preview, publish/retry, unpublish, move to recycle bin, restore, and permanent delete with confirmation.

### Editor

- Title at the top, focused writing canvas, metadata panel, save controls, preview, and publish action.
- Switches between visual editing and Markdown source editing without changing the canonical Markdown field.
- Supports headings, paragraphs, emphasis, lists, blockquotes, links, tables, code blocks, inline code, images, horizontal rules, task lists, and math syntax already supported by the blog.
- Unsupported MDX or raw HTML remains editable in source mode and produces a clear visual-mode warning instead of destructive conversion.
- Autosave writes a new draft only after the first explicit save, then saves debounced changes with optimistic concurrency checks.
- Navigation with unsaved changes requires confirmation.
- Dragging, selecting, or pasting an image uploads through the CMS EasyImage proxy and inserts the returned Markdown image URL.

### Publishing

- Publish returns immediately after queueing a job.
- The UI streams or polls job status and displays concise progress stages and full logs on demand.
- Failed builds say that the live site is unchanged and provide Retry.
- Preview renders current unsaved Markdown in an isolated preview surface without publishing it.

## Publishing Pipeline

1. A save transaction validates the post, applies optimistic locking, updates associations, and stores a version snapshot.
2. Publish/unpublish/delete/restore changes desired content state and queues a job for the resulting database revision.
3. The publisher takes a consistent snapshot of all non-deleted published posts.
4. It creates a new timestamped release workspace beneath a configured releases root.
5. It materializes Markdown/MDX files using safe relative paths and normalized frontmatter.
6. It builds Astro with a production environment and captures bounded output.
7. It verifies that the expected `dist` entry point and critical generated routes exist.
8. It atomically switches the nginx document-root symlink to the new release.
9. It records the deployed database revision and prunes old releases while retaining the latest successful releases for rollback.
10. Any failure before activation marks the job failed and leaves the live symlink untouched.

Rollback activates a previously successful release and records a rollback job; it does not silently rewrite current database content.

## Existing Content Migration

- A dry-run command scans `src/content/blog/**/*.{md,mdx}` and reports valid posts, validation failures, duplicate slugs, and path conflicts.
- Import is idempotent by original relative path and content hash.
- Frontmatter fields map to the database schema; directory-derived categories follow the existing category utility.
- The raw body is preserved byte-for-byte except for normalized line endings.
- Imported posts receive an initial version marked `import`.
- No source files are deleted by migration.
- After import and a successful CMS build comparison, MySQL becomes the source of truth for publishing.

## Error Handling and Recovery

- Validation errors identify the exact field and retain editor content.
- A stale optimistic-lock version returns a conflict response and offers reload or copy-current-content; it never overwrites silently.
- Image upload errors keep the draft unchanged and allow retry.
- Database outages disable mutations and report service unavailability without leaking connection details.
- Publisher timeouts terminate the child process tree, mark the job failed, and keep the current release active.
- Each job has bounded logs and a stable correlation ID.
- Database and release backups are operational prerequisites before production activation.

## Testing Strategy

- Domain and validation tests cover slugs, post status transitions, version retention, frontmatter export, safe paths, optimistic locking, and publish queue coalescing.
- API tests use Fastify injection with repository test doubles to cover authentication, authorization, CSRF, articles, filters, image proxy validation, and publishing responses.
- MySQL integration tests run migrations against a disposable database when an integration-test URL is present.
- React component tests cover login, article list filters, editor mode switching, dirty-state protection, upload insertion, and publish feedback.
- Publisher tests use temporary directories and an injected command runner to prove failed builds never activate a release and successful builds switch only after verification.
- A browser smoke test covers login, create draft, edit, preview, publish, observe job success, and open the public article.
- Production verification includes database migration status, API health, a successful build, nginx content checks, process restart behavior, and rollback rehearsal.

## Initial Release Scope

Included: single-admin authentication, dashboard summary, articles, categories, tags, dual-mode editing, preview, EasyImage upload, version history, recycle bin, publishing status/history, import, static publishing, and rollback.

Deferred: multiple users and roles, comments moderation, themes, plugins, pages, menus, scheduled publishing, object-storage migration, public CMS access, domain/TLS automation, analytics, and shop features.

## Success Criteria

- The administrator can securely access the CMS through an SSH tunnel and remain authenticated across normal navigation.
- Every existing valid repository post appears in the CMS after import.
- The administrator can create, view, edit, preview, publish, unpublish, delete, restore, and permanently delete posts.
- Visual and source editor modes preserve canonical Markdown and warn before unsupported syntax could be changed.
- EasyImage uploads insert working image URLs into posts.
- A successful publish updates the public Astro site without an nginx outage.
- A failed publish leaves the existing public site unchanged and is diagnosable from the CMS.
- Application runtime uses neither SSH passwords nor MySQL root credentials.

