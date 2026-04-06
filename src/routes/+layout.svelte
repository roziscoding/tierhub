<script lang='ts'>
  import '$lib/tokens.css'

  const { children } = $props()
</script>

<svelte:head>
  <title>TierHub - Tier List Maker</title>
</svelte:head>

{@render children()}

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
    justify-content: center;
  }

  :global(*) {
    box-sizing: border-box;
  }

</style>
