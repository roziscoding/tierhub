<script lang='ts'>
  import { base } from '$app/paths'

  import { page } from '$app/stores'
  import { authClient } from '$lib/auth'
  import '$lib/tokens.css'

  const session = authClient.useSession()
  const { children } = $props()

  const publicPaths = [`${base}/login`, `${base}/signup`, `${base}/tierlist`]

  const isPublic = $derived(publicPaths.some(p => $page.url.pathname === p || $page.url.pathname === `${p}/`))

  $effect(() => {
    if (!$session.isPending && !$session.data && !isPublic) {
      window.location.href = `${base}/login`
    }
  })

  async function handleLogout() {
    await authClient.signOut()
    window.location.href = `${base}/login`
  }
</script>

<svelte:head>
  <title>TierHub - Tier List Maker</title>
</svelte:head>

{#if $session.isPending && !isPublic}
  <div class='loading'>Loading...</div>
{:else}
  {#if $session.data}
    <nav class='topbar'>
      <a href='{base}/' class='brand'>TierHub</a>
      <div class='user'>
        <span class='username'>{$session.data.user.name}</span>
        <button class='logout' onclick={handleLogout}>Log out</button>
      </div>
    </nav>
  {/if}

  {@render children()}
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: var(--color-surface);
    border-bottom: 0.0625rem solid var(--color-border);
  }

  .brand {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-primary);
    text-decoration: none;
  }

  .user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .username {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  .logout {
    background: none;
    border: 0.0625rem solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    font-size: 0.8rem;
    font-family: inherit;
    padding: 0.25rem 0.625rem;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .logout:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: var(--color-text-muted);
    font-size: 1.1rem;
  }
</style>
