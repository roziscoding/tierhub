# TierHub

A simple, static tier list maker. Upload images, drag them into tiers, reorder everything.

## Features

- Drag and drop images between tiers and a shared pool
- Reorder tiers by dragging the colored label
- Up to 10 tiers with customizable labels and colors (15-color palette)
- Lightbox for viewing full-size images
- Dynamic sizing — tiers and items scale with the number of rows
- Works on desktop and mobile (touch support via svelte-dnd-action)
- Export tier list as image
- Templates with IndexedDB persistence
- Fully client-side, no backend
- Deployed to [GitHub Pages](https://about.rjmunhoz.me/tierhub/)

## Getting started

Requires [bun](https://bun.sh) and [mise](https://mise.jdx.dev).

```bash
bun install
mise dev
```

Open [localhost:5175](http://localhost:5175).

## Scripts

| Command | Description |
|---|---|
| `mise dev` | Start dev server |
| `mise build` | Production build |
| `mise lint` | Run eslint |
| `mise lint:fix` | Auto-fix lint issues |
| `mise check` | Type check with svelte-check |
| `mise ok` | Lint + type check |

## Tech stack

- [Svelte 5](https://svelte.dev) + [SvelteKit](https://svelte.dev/docs/kit)
- [svelte-dnd-action](https://github.com/isaacHagoel/svelte-dnd-action) for drag and drop
- [TypeScript](https://www.typescriptlang.org)
- [@antfu/eslint-config](https://github.com/antfu/eslint-config)
- [Bun](https://bun.sh) + [Mise](https://mise.jdx.dev)
