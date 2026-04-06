<script lang='ts'>
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'ghost'
    full?: boolean
    children: Snippet
  }

  const { variant = 'primary', full = false, children, ...rest }: Props = $props()
</script>

<button class='btn btn-{variant}' class:full {...rest}>
  {@render children()}
</button>

<style>
  .btn {
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    font-family: inherit;
    transition: background 0.15s, border-color 0.15s;
  }

  .btn.full {
    width: 100%;
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--color-primary-text);
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
  }

  .btn-ghost {
    background: var(--color-surface-raised);
    color: var(--color-text-muted);
    border: 0.0625rem solid var(--color-border);
  }

  .btn-ghost:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }
</style>
