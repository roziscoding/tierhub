<script lang='ts'>
  import type { Tier, TierItem } from '$lib/types'

  import { page } from '$app/stores'
  import TierlistEditor from '$lib/components/TierlistEditor.svelte'
  import { getTemplate } from '$lib/db'
  import { onMount } from 'svelte'

  let title = $state('')
  let description = $state('')
  let tiers: Tier[] = $state([])
  let pool: TierItem[] = $state([])
  let loading = $state(true)

  onMount(async () => {
    const id = Number($page.params.id)
    const template = await getTemplate(id)
    if (!template) {
      window.location.href = '/'
      return
    }
    title = template.title
    description = template.description || ''
    let nextId = 1
    tiers.push(...template.tiers.map((t, i) => ({
      id: i + 1,
      label: t.label,
      color: t.color,
      items: [] as TierItem[],
    })))
    pool.push(...template.items.map(item => ({
      id: nextId++,
      src: item.src,
    })))
    loading = false
  })
</script>

{#if loading}
  <div class='loading'>Loading...</div>
{:else}
  <div class='app'>
    <header>
      <a href='/' class='back'>&larr; Back</a>
      <h1>{title}</h1>
      {#if description}
        <p class='subtitle'>{description}</p>
      {/if}
    </header>

    <TierlistEditor bind:tiers bind:pool exportFilename={`${title || 'tierlist'}.png`} />
  </div>
{/if}

<style>
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    color: var(--color-text-muted);
    font-size: 1.1rem;
  }

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
