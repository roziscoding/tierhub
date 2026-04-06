<script lang='ts'>
  import type { Tier, TierItem } from '$lib/types'

  import { base } from '$app/paths'
  import TierlistEditor from '$lib/components/TierlistEditor.svelte'

  let tiers: Tier[] = $state([
    { id: 1, label: 'S', color: '#FF6B6B', items: [] },
    { id: 2, label: 'A', color: '#FFB347', items: [] },
    { id: 3, label: 'B', color: '#FFFF66', items: [] },
    { id: 4, label: 'C', color: '#66FF66', items: [] },
    { id: 5, label: 'F', color: '#6666FF', items: [] },
  ])
  let pool: TierItem[] = $state([])
</script>

<div class='app'>
  <header>
    <a href='{base}/' class='back'>&larr; Back</a>
    <h1>TierHub</h1>
    <p class='subtitle'>Drag and drop images into tiers</p>
  </header>

  <TierlistEditor bind:tiers bind:pool editTiers editPool />
</div>

<style>
  .app {
    width: 80%;
    margin: 0 auto;
    padding: 2rem 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  header {
    text-align: center;
    position: relative;
  }

  .back {
    position: absolute;
    left: 0;
    top: 0;
    line-height: 2rem;
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: 0.85rem;
    transition: color 0.15s;
  }

  .back:hover {
    color: var(--color-primary);
  }

  h1 {
    font-size: 2rem;
    margin: 0;
    color: var(--color-primary);
  }

  .subtitle {
    margin: 0.25rem 0 0;
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }
</style>
