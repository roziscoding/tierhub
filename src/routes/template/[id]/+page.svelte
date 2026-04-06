<script lang='ts'>
  import type { DndEvent } from 'svelte-dnd-action'

  import { page } from '$app/stores'
  import { getTemplate } from '$lib/db'
  import { onMount } from 'svelte'
  import { dndzone } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'

  interface TierItem {
    id: number
    src: string
  }

  interface Tier {
    id: number
    label: string
    color: string
    items: TierItem[]
  }

  const FLIP_MS = 150
  const ZONE_TYPE = 'tierlist'

  let title = $state('')
  let description = $state('')
  const tiers: Tier[] = $state([])
  let pool: TierItem[] = $state([])
  let loading = $state(true)
  let lightboxSrc = $state<string | null>(null)

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

  function handleTierConsider(i: number, e: CustomEvent<DndEvent<TierItem>>) {
    tiers[i].items = e.detail.items
  }

  function handleTierFinalize(i: number, e: CustomEvent<DndEvent<TierItem>>) {
    tiers[i].items = e.detail.items
  }

  function handlePoolConsider(e: CustomEvent<DndEvent<TierItem>>) {
    pool = e.detail.items
  }

  function handlePoolFinalize(e: CustomEvent<DndEvent<TierItem>>) {
    pool = e.detail.items
  }

  function removeItemFromTier(tierIndex: number, itemIndex: number) {
    const [item] = tiers[tierIndex].items.splice(itemIndex, 1)
    pool.push(item)
  }

  function textColor(bg: string): string {
    const hex = bg.replace('#', '')
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.5 ? '#000' : '#fff'
  }

  function openLightbox(src: string) {
    lightboxSrc = src
  }

  function closeLightbox() {
    lightboxSrc = null
  }

  $effect(() => {
    if (tiers.length === 0)
      return
    const s = document.documentElement.style
    s.setProperty('--tier-count', String(tiers.length))
    s.setProperty('--item-size', `max(5rem, calc(60vh / ${tiers.length}))`)
  })
</script>

<svelte:window onkeydown={e => e.key === 'Escape' && closeLightbox()} />

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

    <div class='tierlist'>
      {#each tiers as tier, i (tier.id)}
        <div class='tier-row'>
          <div class='tier-label-wrapper' style='background: {tier.color}; color: {textColor(tier.color)}'>
            <span class='label-text'>{tier.label}</span>
          </div>
          <div
            class='tier-items'
            use:dndzone={{ items: tier.items, flipDurationMs: FLIP_MS, type: ZONE_TYPE }}
            onconsider={e => handleTierConsider(i, e)}
            onfinalize={e => handleTierFinalize(i, e)}
          >
            {#each tier.items as item (item.id)}
              <div class='item' animate:flip={{ duration: FLIP_MS }}>
                <button class='item-img-btn' onclick={() => openLightbox(item.src)}>
                  <img src={item.src} alt='' class='item-img' />
                </button>
                <button class='item-remove' onclick={() => removeItemFromTier(i, tier.items.indexOf(item))}>&times;</button>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class='pool-section'>
      <div class='pool-wrapper' class:pool-empty={pool.length === 0}>
        {#if pool.length === 0}
          <div class='pool-done'>All items placed!</div>
        {/if}
        <div
          class='pool'
          role='list'
          use:dndzone={{ items: pool, flipDurationMs: FLIP_MS, type: ZONE_TYPE }}
          onconsider={handlePoolConsider}
          onfinalize={handlePoolFinalize}
        >
          {#each pool as item (item.id)}
            <div class='item' animate:flip={{ duration: FLIP_MS }}>
              <button class='item-img-btn' onclick={() => openLightbox(item.src)}>
                <img src={item.src} alt='' class='item-img' />
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

{#if lightboxSrc}
  <div class='lightbox' onclick={closeLightbox} onkeydown={e => e.key === 'Escape' && closeLightbox()} role='dialog' tabindex='0'>
    <button class='lightbox-close' onclick={closeLightbox}>&times;</button>
    <button class='lightbox-img-btn' onclick={e => e.stopPropagation()}>
      <img src={lightboxSrc} alt='' class='lightbox-img' />
    </button>
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

  .tierlist {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 0.125rem solid var(--color-border);
  }

  .tier-row {
    display: flex;
    min-height: var(--item-size);
    background: var(--color-surface-raised);
  }

  .tier-label-wrapper {
    width: var(--item-size);
    min-width: var(--item-size);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.25rem;
    padding: 0.25rem;
    word-break: break-word;
    text-align: center;
    line-height: 1.2;
  }

  .label-text {
    color: inherit;
    font: inherit;
    padding: 0.125rem 0.25rem;
    word-break: break-word;
    text-align: center;
  }

  .tier-items {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    gap: 0.125rem;
  }

  .item {
    position: relative;
    cursor: grab;
    user-select: none;
  }

  .item:active {
    cursor: grabbing;
  }

  .item-img-btn {
    display: block;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .item-img {
    width: var(--item-size);
    height: var(--item-size);
    object-fit: cover;
    display: block;
    border-radius: var(--radius-sm);
  }

  .item-remove {
    position: absolute;
    top: -0.375rem;
    right: -0.375rem;
    background: rgba(0,0,0,0.7);
    border: none;
    color: #fff;
    cursor: pointer;
    font-size: 0.8rem;
    width: 1.125rem;
    height: 1.125rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .item:hover .item-remove {
    opacity: 1;
  }

  .item-remove:hover {
    background: var(--color-danger);
  }

  .pool-wrapper {
    position: relative;
    min-height: var(--item-size);
    background: var(--color-surface);
    border: 0.0625rem solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 0.375rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: flex-start;
    align-content: flex-start;
    transition: border-color 0.15s, background 0.15s;
    box-shadow: inset 0 0.125rem 0.5rem rgba(0, 0, 0, 0.4);
  }

  .pool-wrapper:hover {
    border-color: var(--color-border-hover);
  }

  .pool-wrapper.pool-empty {
    min-height: 3.5rem;
    align-items: center;
    justify-content: center;
  }

  .pool {
    display: contents;
  }

  .pool-done {
    color: var(--color-text-faint);
    font-size: 0.9rem;
    padding: 0.5rem;
  }

  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    cursor: pointer;
  }

  .lightbox-close {
    position: absolute;
    top: 1.25rem;
    right: 1.5rem;
    background: none;
    border: none;
    color: #fff;
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
  }

  .lightbox-close:hover {
    color: var(--color-danger);
  }

  .lightbox-img-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: default;
  }

  .lightbox-img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: var(--radius-lg);
  }
</style>
