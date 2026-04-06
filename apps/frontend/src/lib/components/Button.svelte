<script lang='ts'>
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'ghost' | 'danger'
    full?: boolean
    disabled?: boolean
    confirm?: string
    children: Snippet
  }

  const { variant = 'primary', full = false, disabled = false, confirm, onclick, children, ...rest }: Props = $props()

  let confirming = $state(false)

  function handleClick(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
    if (confirm && !confirming) {
      confirming = true
      return
    }
    confirming = false
    if (onclick)
      (onclick as (e: MouseEvent & { currentTarget: HTMLButtonElement }) => void)(e)
  }

  function handleBlur() {
    confirming = false
  }
</script>

<button class='btn btn-{variant}' class:full class:confirming {disabled} onclick={handleClick} onblur={handleBlur} {...rest}>
  {#if confirming}
    {confirm}
  {:else}
    {@render children()}
  {/if}
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
    transition: background 0.15s, border-color 0.15s, opacity 0.15s;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn.full {
    width: 100%;
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--color-primary-text);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .btn-ghost {
    background: var(--color-surface-raised);
    color: var(--color-text-muted);
    border: 0.0625rem solid var(--color-border);
  }

  .btn-ghost:hover:not(:disabled) {
    background: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }

  .btn-danger {
    background: none;
    color: var(--color-danger);
    border: 0.0625rem solid var(--color-danger);
    opacity: 0.6;
  }

  .btn-danger:hover:not(:disabled) {
    opacity: 1;
  }

  .btn-danger.confirming {
    background: var(--color-danger);
    color: #fff;
    opacity: 1;
  }
</style>
