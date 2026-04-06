# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Use mise tasks for development (preferred):**

- `mise dev` — start dev server with hot reload
- `mise build` — production build (outputs to `build/`)
- `mise check` — run svelte-check for type errors
- `mise lint` — run eslint
- `mise lint:fix` — eslint with auto-fix
- `mise ok` — run both lint and check (use before committing)

**Package manager is bun (v1.3.11).** Use `bun add`/`bun remove` for dependencies.

## Architecture

Single-page static tier list maker built with **SvelteKit 2 + Svelte 5 runes + TypeScript**. Pre-rendered via `adapter-static`.

### Key files

- `src/routes/+page.svelte` — the entire app (tiers, pool, drag-and-drop, lightbox, color picker)
- `src/lib/tokens.css` — design tokens (colors, radii) as CSS custom properties on `:root`
- `src/lib/components/Button.svelte` — reusable button (variants: `primary`, `ghost`)
- `src/routes/+layout.svelte` — imports tokens, sets global body styles

### Data model

- `TierItem` — `{ id, src }` where `src` is a data URL
- `Tier` — `{ id, label, color, items: TierItem[] }`

All state is client-side via `$state()`. No persistence, no backend.

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
- ESLint config: `@antfu/eslint-config` with svelte + typescript
- Scoped `<style>` in components; globals only in `+layout.svelte`
- All units in `rem` (no `px`)
- Run `mise ok` to validate before committing

## Git

- **No co-authored-by or credit lines** in commit messages — never self-attribute
- **Conventional commits** (`feat:`, `fix:`, `refactor:`, `style:`, `chore:`, etc.)
- **One commit per logical change** — split work into focused commits, don't bundle unrelated changes together
