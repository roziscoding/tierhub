<script lang='ts'>
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
    background: #1a1a2e;
    color: #eee;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    min-height: 100vh;
  }

  :global(*) {
    box-sizing: border-box;
  }
</style>
