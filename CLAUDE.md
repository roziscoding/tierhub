# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Use mise tasks for development (preferred):**

- `mise dev` — start frontend + backend dev servers
- `mise build` — production build (frontend only, outputs to `apps/frontend/build/`)
- `mise check` — run type checking for all workspaces
- `mise lint` — run eslint
- `mise lint:fix` — eslint with auto-fix
- `mise ok` — run both lint and check (use before committing)
- `mise preview` — preview frontend production build locally

**Package manager is bun (v1.3.11) with workspaces.** Use `bun add`/`bun remove` with `--filter` for workspace-specific deps.

**Database (backend):**

- `bun run --filter '@tierhub/backend' db:generate` — generate Drizzle migrations
- `bun run --filter '@tierhub/backend' db:migrate` — run Drizzle migrations

## Architecture

**Monorepo** with Bun workspaces (`apps/*`):

### `apps/frontend` — SvelteKit static app

Static tier list maker built with **SvelteKit 2 + Svelte 5 runes + TypeScript**. Pre-rendered via `adapter-static`, deployed to **GitHub Pages** via GitHub Actions.

#### Deployment

- GitHub Actions workflow in `.github/workflows/deploy.yml` builds and deploys on push to `main`
- Base path is `/tierhub` in production (empty in dev) — all internal links must use `{base}` from `$app/paths`
- `adapter-static` uses `fallback: '404.html'` for SPA client-side routing on GitHub Pages
- Dynamic routes (e.g. `/template/[id]`) have `prerender = false`

#### Key files

- `apps/frontend/src/routes/+page.svelte` — home page with template list and navigation
- `apps/frontend/src/routes/tierlist/+page.svelte` — single-use tier list editor
- `apps/frontend/src/routes/template/+page.svelte` — template creation page
- `apps/frontend/src/routes/template/[id]/+page.svelte` — play a template (loads from IndexedDB)
- `apps/frontend/src/lib/components/TierlistEditor.svelte` — reusable tier list editor component
- `apps/frontend/src/lib/components/TierItem.svelte` — reusable tier item component
- `apps/frontend/src/lib/components/Button.svelte` — reusable button (variants: `primary`, `ghost`, `danger`)
- `apps/frontend/src/lib/tokens.css` — design tokens (colors, radii) as CSS custom properties on `:root`
- `apps/frontend/src/lib/db.ts` — IndexedDB persistence for templates
- `apps/frontend/src/routes/+layout.svelte` — imports tokens, sets global body styles

### `apps/backend` — Hono API

**Hono + hono-openapi + Zod** for validation and OpenAPI docs. Runs on **Bun**.

- `apps/backend/src/index.ts` — app entry point with health check and Swagger UI
- `apps/backend/src/db/schema.ts` — Drizzle ORM schema (PostgreSQL)
- `apps/backend/src/db/index.ts` — database connection
- `apps/backend/drizzle.config.ts` — Drizzle Kit configuration

**Database:** PostgreSQL via `postgres` driver + Drizzle ORM. Connection string from `DATABASE_URL` env var.

### Data model

- `TierItem` — `{ id, src }` where `src` is a data URL
- `Tier` — `{ id, label, color, items: TierItem[] }`

Runtime state is client-side via `$state()`. Templates are persisted in IndexedDB (frontend) and PostgreSQL (backend).

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
