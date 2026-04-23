# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Use mise tasks for development (preferred):**

- `mise dev` — start Postgres (Docker), push schema, start frontend + backend
- `mise build` — production build (frontend only, outputs to `apps/frontend/build/`)
- `mise check` — run type checking for all workspaces
- `mise lint` — run eslint
- `mise lint:fix` — eslint with auto-fix
- `mise ok` — run both lint and check (use before committing)
- `mise preview` — preview frontend production build locally

**Package manager is bun (v1.3.11) with workspaces.** Install workspace deps from within the workspace dir (`cd apps/backend && bun add ...`).

**Database (backend):**

- `bun run --filter '@tierhub/backend' db:push` — push schema to DB (dev)
- `bun run --filter '@tierhub/backend' db:generate` — generate Drizzle migrations
- `bun run --filter '@tierhub/backend' db:migrate` — run Drizzle migrations

**Infrastructure:**

- `docker compose up -d postgres` — start PostgreSQL

## Architecture

**Monorepo** with Bun workspaces (`apps/*`):

### `apps/frontend` — SvelteKit SPA

Tier list maker built with **SvelteKit 2 + Svelte 5 runes + TypeScript**. Pre-rendered via `adapter-static`, deployed to **GitHub Pages** via GitHub Actions.

#### Auth

- **Better Auth** Svelte client (`$lib/auth.ts`) provides `authClient` with `useSession()` store
- Login (`/login`) and signup (`/signup`) pages with email/password
- Layout (`+layout.svelte`) redirects unauthenticated users to `/login`
- Public routes: `/login`, `/signup`, `/tierlist` (single-use, no auth required)

#### API client

- `$lib/api.ts` — fetch-based client for the backend API
- All API calls include `credentials: 'include'` for cookie-based auth
- `VITE_API_URL` env var configures backend URL (default: `http://localhost:3000`)

#### Key files

- `apps/frontend/src/routes/+page.svelte` — home page with template list
- `apps/frontend/src/routes/tierlist/+page.svelte` — single-use tier list editor (no auth)
- `apps/frontend/src/routes/template/+page.svelte` — template creation page
- `apps/frontend/src/routes/template/[id]/+page.svelte` — play a template
- `apps/frontend/src/routes/login/+page.svelte` — login page
- `apps/frontend/src/routes/signup/+page.svelte` — signup page
- `apps/frontend/src/lib/components/TierlistEditor.svelte` — reusable tier list editor component
- `apps/frontend/src/lib/components/TierItem.svelte` — reusable tier item component
- `apps/frontend/src/lib/components/Button.svelte` — reusable button (variants: `primary`, `ghost`, `danger`)
- `apps/frontend/src/lib/tokens.css` — design tokens (colors, radii) as CSS custom properties on `:root`
- `apps/frontend/src/lib/auth.ts` — Better Auth Svelte client
- `apps/frontend/src/lib/api.ts` — backend API client
- `apps/frontend/src/routes/+layout.svelte` — auth guard, topbar, global styles

#### Deployment

- GitHub Actions workflow in `.github/workflows/deploy.yml` builds and deploys on push to `main`
- Base path is `/tierhub` in production (empty in dev) — all internal links must use `{base}` from `$app/paths`
- `adapter-static` uses `fallback: '404.html'` for SPA client-side routing on GitHub Pages
- Dynamic routes (e.g. `/template/[id]`) have `prerender = false`

### `apps/backend` — Hono API

**Hono + hono-openapi + Zod** for validation and OpenAPI docs. Runs on **Bun**.

#### Auth

- **Better Auth** server (`src/auth.ts`) with Drizzle adapter and email/password
- Auth routes mounted at `/api/auth/**`
- `src/middleware/auth.ts` — `requireAuth` middleware extracts session/user from cookie
- All template routes require authentication; templates are scoped to the authenticated user

#### Key files

- `apps/backend/src/index.ts` — app entry point, CORS, bodyLimit, auth routes, Swagger UI
- `apps/backend/src/auth.ts` — Better Auth server configuration
- `apps/backend/src/routes/templates.ts` — template CRUD routes (auth-protected)
- `apps/backend/src/middleware/auth.ts` — requireAuth middleware
- `apps/backend/src/db/schema.ts` — Drizzle ORM schema (templates, tiers, items)
- `apps/backend/src/db/auth-schema.ts` — Better Auth tables (user, session, account, verification)
- `apps/backend/src/db/index.ts` — database connection
- `apps/backend/src/types.ts` — shared Hono env types (AuthEnv)
- `apps/backend/src/validation.ts` — image size validation (1 MB max)
- `apps/backend/drizzle.config.ts` — Drizzle Kit configuration

**Database:** PostgreSQL via `postgres` driver + Drizzle ORM. Connection string from `DATABASE_URL` env var. Docker Compose provides a dev PostgreSQL instance.

**Environment variables (backend):**

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — secret for session signing (min 32 chars)

### Data model

- `Template` — `{ id, userId, title, description, tiers, items, createdAt }`
- `TemplateTier` — `{ label, color }` — tier definition (label + color)
- `TemplateItem` — `{ src }` — pool item (data URL image)
- `TierItem` (runtime) — `{ id, src }` — runtime item with local ID
- `Tier` (runtime) — `{ id, label, color, items: TierItem[] }`

Templates stored in PostgreSQL. Runtime editor state is client-side via `$state()`.

### Drag and drop

Uses `svelte-dnd-action` with two zone types:
- `'tierlist'` — items move between tiers and pool (`use:dndzone`)
- `'tier-rows'` — reorder tier rows by dragging the label (`use:dragHandleZone` + `use:dragHandle`)

Both `onconsider` and `onfinalize` must update state. Items require unique `id` fields and `{#each}` blocks must use `(item.id)` keys.

### Dynamic sizing

`--item-size` and `--tier-count` are set on `document.documentElement` via `$effect()` so drag shadow elements (appended to `<body>` by svelte-dnd-action) inherit them.

### Design system

Accent color is amber (`--color-primary: #e8a912`). Dark theme with neutral grays. All colors and radii come from CSS custom properties in `tokens.css`.

## Conventions

- Svelte 5 runes only (`$state`, `$props`, `$effect`) — no legacy reactive syntax
- ESLint config: `@antfu/eslint-config` with svelte + typescript (root level)
- Scoped `<style>` in components; globals only in `+layout.svelte`
- All units in `rem` (no `px`)
- Run `mise ok` to validate before committing

## Git

- **No co-authored-by or credit lines** in commit messages — never self-attribute
- **Conventional commits** (`feat:`, `fix:`, `refactor:`, `style:`, `chore:`, etc.)
- **One commit per logical change** — split work into focused commits, don't bundle unrelated changes together
