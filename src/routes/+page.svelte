<script lang='ts'>
  import type { DndEvent } from 'svelte-dnd-action'
  import Button from '$lib/components/Button.svelte'
  import { dndzone, dragHandle, dragHandleZone } from 'svelte-dnd-action'
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
  const TIER_ZONE_TYPE = 'tier-rows'

  const PALETTE = [
    '#FF6B6B',
    '#FFB347',
    '#FFCC80',
    '#FFFF66',
    '#CCFF66',
    '#66FF66',
    '#66FFCC',
    '#00FFFF',
    '#6666FF',
    '#FF66FF',
    '#CC99CC',
    '#000000',
    '#808080',
    '#C0C0C0',
    '#FFFFFF',
  ]

  let nextId = $state(1)
  let nextTierId = $state(6)
  const tiers: Tier[] = $state([
    { id: 1, label: 'S', color: '#FF6B6B', items: [] },
    { id: 2, label: 'A', color: '#FFB347', items: [] },
    { id: 3, label: 'B', color: '#FFFF66', items: [] },
    { id: 4, label: 'C', color: '#66FF66', items: [] },
    { id: 5, label: 'F', color: '#6666FF', items: [] },
  ])
  let pool: TierItem[] = $state([])
  let editingTier = $state<number | null>(null)
  let editingLabel = $state('')
  let colorPickerTier = $state<number | null>(null)
  let lightboxSrc = $state<string | null>(null)
  let fileInput = $state<HTMLInputElement | null>(null)

  function toggleColorPicker(index: number) {
    colorPickerTier = colorPickerTier === index ? null : index
  }

  function pickColor(index: number, color: string) {
    tiers[index].color = color
    colorPickerTier = null
  }

  function addTier() {
    if (tiers.length >= 10)
      return
    const nextColor = PALETTE[tiers.length % PALETTE.length]
    tiers.push({ id: nextTierId++, label: '', color: nextColor, items: [] })
  }

  function removeTier(index: number) {
    pool.push(...tiers[index].items)
    tiers.splice(index, 1)
  }

  function processFiles(files: FileList) {
    for (const file of files) {
      if (!file.type.startsWith('image/'))
        continue
      const reader = new FileReader()
      reader.onload = () => {
        pool.push({ id: nextId++, src: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  function handleFiles(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const files = input.files
    if (!files)
      return
    processFiles(files)
    input.value = ''
  }

  function handleNativeFileDrop(e: DragEvent) {
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      e.preventDefault()
      processFiles(e.dataTransfer.files)
    }
  }

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

  function startEditLabel(index: number) {
    editingTier = index
    editingLabel = tiers[index].label
  }

  function finishEditLabel() {
    if (editingTier !== null) {
      tiers[editingTier].label = editingLabel
      editingTier = null
    }
  }

  function removeItemFromPool(index: number) {
    pool.splice(index, 1)
  }

  function removeItemFromTier(tierIndex: number, itemIndex: number) {
    tiers[tierIndex].items.splice(itemIndex, 1)
  }

  function textColor(bg: string): string {
    const hex = bg.replace('#', '')
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.5 ? '#000' : '#fff'
  }

  function handleTierRowConsider(e: CustomEvent<DndEvent<Tier>>) {
    // Need to preserve items arrays since dnd-action replaces them
    const newTiers = e.detail.items
    for (const t of newTiers) {
      if (!t.items)
        t.items = []
    }
    tiers.length = 0
    tiers.push(...newTiers)
  }

  function handleTierRowFinalize(e: CustomEvent<DndEvent<Tier>>) {
    const newTiers = e.detail.items
    for (const t of newTiers) {
      if (!t.items)
        t.items = []
    }
    tiers.length = 0
    tiers.push(...newTiers)
  }

  function openLightbox(src: string) {
    lightboxSrc = src
  }

  function closeLightbox() {
    lightboxSrc = null
  }

  $effect(() => {
    const s = document.documentElement.style
    s.setProperty('--tier-count', String(tiers.length))
    s.setProperty('--item-size', `max(5rem, calc(60vh / ${tiers.length}))`)
  })
</script>

<svelte:window onkeydown={e => e.key === 'Escape' && closeLightbox()} />

<div class='app'>
  <header>
    <h1>TierHub</h1>
    <p class='subtitle'>Drag and drop images into tiers</p>
  </header>

  <div
    class='tierlist'
    use:dragHandleZone={{ items: tiers, flipDurationMs: FLIP_MS, type: TIER_ZONE_TYPE }}
    onconsider={handleTierRowConsider}
    onfinalize={handleTierRowFinalize}
  >
    {#each tiers as tier, i (tier.id)}
      <div class='tier-row' animate:flip={{ duration: FLIP_MS }}>
        <div class='tier-label-wrapper' style='background: {tier.color}; color: {textColor(tier.color)}'>
          {#if editingTier === i}
            <!-- svelte-ignore a11y_autofocus -->
            <input
              class='label-input'
              bind:value={editingLabel}
              onblur={finishEditLabel}
              onkeydown={e => e.key === 'Enter' && finishEditLabel()}
              autofocus
              style='color: {textColor(tier.color)}'
            />
          {:else}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class='tier-label' use:dragHandle ondblclick={() => startEditLabel(i)}>
              <span class='label-text'>{tier.label}</span>
            </div>
          {/if}
          <div class='tier-controls'>
            <button
              class='color-swatch-btn'
              style='background: {tier.color}'
              onclick={() => toggleColorPicker(i)}
              title='Change color'
            ></button>
            <button class='tier-remove' onclick={() => removeTier(i)} title='Remove tier'>&times;</button>
          </div>
          {#if colorPickerTier === i}
            <div class='color-popover'>
              {#each PALETTE as color}
                <button
                  class='palette-color'
                  class:selected={tier.color === color}
                  style='background: {color}'
                  onclick={() => pickColor(i, color)}
                  title={color}
                ></button>
              {/each}
            </div>
          {/if}
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

  {#if tiers.length < 10}
    <div class='add-tier-wrapper'>
      <Button onclick={addTier} full>+ Add Tier</Button>
    </div>
  {/if}

  <div class='pool-section'>
    <input
      bind:this={fileInput}
      type='file'
      accept='image/*'
      multiple
      onchange={handleFiles}
      hidden
    />
    <div
      class='pool'
      class:pool-empty={pool.length === 0}
      role='list'
      use:dndzone={{ items: pool, flipDurationMs: FLIP_MS, type: ZONE_TYPE }}
      onconsider={handlePoolConsider}
      onfinalize={handlePoolFinalize}
      ondragover={e => e.preventDefault()}
      ondrop={handleNativeFileDrop}
    >
      <button class='pool-empty-state' style:display={pool.length === 0 ? 'flex' : 'none'} onclick={() => fileInput?.click()}>
        <svg class='upload-icon' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
          <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
          <polyline points='17 8 12 3 7 8' />
          <line x1='12' y1='3' x2='12' y2='15' />
        </svg>
        <span class='pool-empty-title'>Drop images here or click to upload</span>
        <span class='pool-empty-hint'>Supports JPG, PNG, GIF, WebP</span>
      </button>
      {#each pool as item (item.id)}
        <div class='item' animate:flip={{ duration: FLIP_MS }}>
          <button class='item-img-btn' onclick={() => openLightbox(item.src)}>
            <img src={item.src} alt='' class='item-img' />
          </button>
          <button class='item-remove' onclick={() => removeItemFromPool(pool.indexOf(item))}>&times;</button>
        </div>
      {/each}
      {#if pool.length > 0}
        <button class='pool-add-btn' onclick={() => fileInput?.click()} title='Add more images'>+</button>
      {/if}
    </div>
  </div>
</div>

{#if lightboxSrc}
  <div class='lightbox' onclick={closeLightbox} onkeydown={e => e.key === 'Escape' && closeLightbox()} role='dialog' tabindex='0'>
    <button class='lightbox-close' onclick={closeLightbox}>&times;</button>
    <button class='lightbox-img-btn' onclick={e => e.stopPropagation()}>
      <img src={lightboxSrc} alt='' class='lightbox-img' />
    </button>
  </div>
{/if}

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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.25rem;
    position: relative;
    padding: 0.25rem;
    word-break: break-word;
    text-align: center;
    line-height: 1.2;
  }

  .tier-label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    cursor: grab;
  }

  .tier-label:active {
    cursor: grabbing;
  }

  .label-text {
    color: inherit;
    font: inherit;
    padding: 0.125rem 0.25rem;
    word-break: break-word;
    text-align: center;
  }

  .label-input {
    width: 90%;
    text-align: center;
    background: rgba(0,0,0,0.2);
    border: 0.0625rem solid rgba(0,0,0,0.3);
    border-radius: var(--radius-sm);
    font-size: 1rem;
    font-weight: bold;
    padding: 0.25rem;
  }

  .tier-controls {
    position: absolute;
    bottom: 0.25rem;
    display: flex;
    gap: 0.125rem;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .tier-row:hover .tier-controls {
    opacity: 1;
  }

  .tier-remove {
    background: rgba(0,0,0,0.25);
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 0.7rem;
    padding: 0.0625rem 0.3125rem;
    border-radius: 0.1875rem;
    line-height: 1;
  }

  .tier-remove:hover {
    background: rgba(0,0,0,0.45);
  }

  .color-swatch-btn {
    width: 1.25rem;
    height: 1.25rem;
    border: 0.125rem solid rgba(0,0,0,0.3);
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
  }

  .color-swatch-btn:hover {
    border-color: rgba(0,0,0,0.6);
  }

  .color-popover {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    background: var(--color-surface);
    border: 0.0625rem solid var(--color-border-hover);
    border-radius: var(--radius-lg);
    padding: 0.5rem;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.375rem;
    z-index: 10;
    box-shadow: 0 0.25rem 1rem rgba(0,0,0,0.5);
  }

  .palette-color {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 0.125rem solid var(--color-border-hover);
    cursor: pointer;
    transition: transform 0.1s;
    padding: 0;
  }

  .palette-color:hover {
    transform: scale(1.2);
    border-color: #aaa;
  }

  .palette-color.selected {
    border-color: #fff;
    box-shadow: 0 0 0 0.125rem #fff;
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

  .pool {
    min-height: var(--item-size);
    background: var(--color-surface);
    border: 0.0625rem solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: flex-start;
    align-content: flex-start;
    transition: border-color 0.15s, background 0.15s;
    box-shadow: inset 0 0.125rem 0.5rem rgba(0, 0, 0, 0.4);
  }

  .pool:hover {
    border-color: var(--color-border-hover);
  }

  .pool.pool-empty {
    min-height: 11.25rem;
    padding: 0;
    align-items: stretch;
    align-content: stretch;
    border-style: solid;
  }

  .pool-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-faint);
    padding: 1.5rem;
    border-radius: var(--radius-md);
    transition: color 0.15s, background 0.15s;
    font-family: inherit;
  }

  .pool-empty-state:hover {
    color: var(--color-primary);
    background: rgba(232, 169, 18, 0.04);
  }

  .upload-icon {
    width: 2.5rem;
    height: 2.5rem;
  }

  .pool-empty-title {
    font-size: 0.95rem;
    font-weight: 500;
  }

  .pool-empty-hint {
    font-size: 0.75rem;
    opacity: 0.6;
  }

  .pool-add-btn {
    width: var(--item-size);
    height: var(--item-size);
    border: none;
    border-radius: var(--radius-sm);
    background: var(--color-primary);
    color: var(--color-primary-text);
    font-size: 1.5rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .pool-add-btn:hover {
    background: var(--color-primary-hover);
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
