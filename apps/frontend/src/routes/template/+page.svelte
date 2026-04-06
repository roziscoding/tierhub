<script lang='ts'>
  import type { Tier, TierItem } from '$lib/types'
  import type { DndEvent } from 'svelte-dnd-action'

  import { base } from '$app/paths'
  import Button from '$lib/components/Button.svelte'
  import TierItemComponent from '$lib/components/TierItem.svelte'
  import { saveTemplate } from '$lib/db'
  import { dragHandle, dragHandleZone } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'

  const FLIP_MS = 150
  const TIER_ZONE_TYPE = 'tier-rows'

  const PALETTE = [
    '#FF6B6B',
    '#FFB347',
    '#FFFF66',
    '#66FF66',
    '#6666FF',
    '#FFCC80',
    '#CCFF66',
    '#66FFCC',
    '#00FFFF',
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
  const pool: TierItem[] = $state([])
  let title = $state('')
  let description = $state('')
  let saving = $state(false)
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

  function removeItemFromPool(index: number) {
    pool.splice(index, 1)
  }

  function handleTierRowConsider(e: CustomEvent<DndEvent<Tier>>) {
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

  async function save() {
    saving = true
    try {
      await saveTemplate({
        title,
        description,
        tiers: tiers.map(t => ({ label: t.label, color: t.color })),
        items: pool.map(i => ({ src: i.src })),
        createdAt: Date.now(),
      })
      window.location.href = '/'
    }
    finally {
      saving = false
    }
  }

  function openLightbox(src: string) {
    lightboxSrc = src
  }

  function closeLightbox() {
    lightboxSrc = null
  }
</script>

<svelte:window
  onkeydown={e => e.key === 'Escape' && closeLightbox()}
  onpointerdown={(e) => {
    if (colorPickerTier !== null && !(e.target as Element)?.closest('.color-popover, .color-swatch-btn'))
      colorPickerTier = null
  }}
/>

<div class='app'>
  <header>
    <a href='{base}/' class='back'>&larr; Back</a>
    <h1>Create Template</h1>
    <p class='subtitle'>Set up tiers and add images to the pool</p>
  </header>

  <section class='section'>
    <input
      class='title-input'
      bind:value={title}
      placeholder='Template title...'
    />
    <textarea
      class='description-input'
      bind:value={description}
      placeholder='Description (optional)...'
      rows='2'
    ></textarea>
  </section>

  <section class='section'>
    <h2 class='section-title'>Tiers</h2>
    <div
      class='tier-list'
      use:dragHandleZone={{ items: tiers, flipDurationMs: FLIP_MS, type: TIER_ZONE_TYPE }}
      onconsider={handleTierRowConsider}
      onfinalize={handleTierRowFinalize}
    >
      {#each tiers as tier, i (tier.id)}
        <div class='tier-chip' animate:flip={{ duration: FLIP_MS }}>
          <span class='drag-grip' use:dragHandle>
            <svg viewBox='0 0 16 16' fill='currentColor' width='16' height='16'>
              <circle cx='5' cy='3' r='1.5' /><circle cx='11' cy='3' r='1.5' />
              <circle cx='5' cy='8' r='1.5' /><circle cx='11' cy='8' r='1.5' />
              <circle cx='5' cy='13' r='1.5' /><circle cx='11' cy='13' r='1.5' />
            </svg>
          </span>
          <div class='color-wrapper'>
            <button
              class='tier-color-btn'
              style='background: {tier.color}'
              onclick={() => toggleColorPicker(i)}
              title='Change color'
            ></button>
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
          <input
            class='label-input'
            bind:value={tier.label}
            placeholder='Tier name...'
          />
          <div class='tier-actions'>
            <button class='chip-remove' onclick={() => removeTier(i)} title='Remove tier'>&times;</button>
          </div>
        </div>
      {/each}
    </div>
    {#if tiers.length < 10}
      <Button onclick={addTier} full>+ Add Tier</Button>
    {/if}
  </section>

  <section class='section'>
    <h2 class='section-title'>Images</h2>
    <input
      bind:this={fileInput}
      type='file'
      accept='image/*'
      multiple
      onchange={handleFiles}
      hidden
    />
    <div class='pool-wrapper' class:pool-empty={pool.length === 0}>
      <button class='pool-empty-state' style:display={pool.length === 0 ? 'flex' : 'none'} onclick={() => fileInput?.click()}>
        <svg class='upload-icon' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
          <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
          <polyline points='17 8 12 3 7 8' />
          <line x1='12' y1='3' x2='12' y2='15' />
        </svg>
        <span class='pool-empty-title'>Drop images here or click to upload</span>
        <span class='pool-empty-hint'>Supports JPG, PNG, GIF, WebP</span>
      </button>
      <div
        class='pool'
        role='list'
        ondragover={e => e.preventDefault()}
        ondrop={handleNativeFileDrop}
      >
        {#each pool as item, i (item.id)}
          <TierItemComponent
            src={item.src}
            removable
            onlightbox={() => openLightbox(item.src)}
            onremove={() => removeItemFromPool(i)}
            onmiddleclick={() => removeItemFromPool(i)}
          />
        {/each}
      </div>
      {#if pool.length > 0}
        <button class='pool-add-btn' onclick={() => fileInput?.click()} title='Add more images'>+</button>
      {/if}
    </div>
  </section>

  <Button onclick={save} full disabled={saving || !title.trim() || pool.length === 0 || tiers.length === 0}>
    {saving ? 'Saving...' : 'Save Template'}
  </Button>
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
    max-width: 50rem;
    margin: 0 auto;
    padding: 2rem 0;
    display: flex;
    flex-direction: column;
    gap: 2rem;
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

  .title-input {
    width: 100%;
    background: var(--color-surface);
    border: 0.0625rem solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-size: 1.25rem;
    font-weight: 600;
    font-family: inherit;
    padding: 0.75rem 1rem;
    outline: none;
    transition: border-color 0.15s;
  }

  .title-input:focus {
    border-color: var(--color-primary);
  }

  .title-input::placeholder {
    color: var(--color-text-faint);
    font-weight: 400;
  }

  .description-input {
    width: 100%;
    background: var(--color-surface);
    border: 0.0625rem solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    font-size: 0.9rem;
    font-family: inherit;
    padding: 0.75rem 1rem;
    outline: none;
    resize: vertical;
    transition: border-color 0.15s;
  }

  .description-input:focus {
    border-color: var(--color-primary);
  }

  .description-input::placeholder {
    color: var(--color-text-faint);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-muted);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tier-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .tier-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-surface);
    border: 0.0625rem solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 0.25rem;
    position: relative;
  }

  .drag-grip {
    cursor: grab;
    user-select: none;
    color: var(--color-text-faint);
    display: flex;
    align-items: center;
    padding: 0 0.125rem;
    flex-shrink: 0;
  }

  .drag-grip:active {
    cursor: grabbing;
  }

  .color-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .tier-color-btn {
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-sm);
    border: 0.125rem solid rgba(255,255,255,0.1);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: border-color 0.15s;
  }

  .tier-color-btn:hover {
    border-color: rgba(255,255,255,0.3);
  }

  .label-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text);
    font-size: 0.95rem;
    font-weight: 600;
    font-family: inherit;
    padding: 0.375rem 0.5rem;
    outline: none;
  }

  .label-input::placeholder {
    color: var(--color-text-faint);
    font-weight: 400;
  }

  .tier-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding-right: 0.25rem;
  }

  .chip-remove {
    background: none;
    border: none;
    color: var(--color-text-faint);
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0 0.25rem;
    line-height: 1;
    transition: color 0.15s;
  }

  .chip-remove:hover {
    color: var(--color-danger);
  }

  .color-popover {
    position: absolute;
    left: 0;
    top: 100%;
    margin-top: 0.375rem;
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

  .pool-wrapper {
    position: relative;
    min-height: 5rem;
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
    min-height: 11.25rem;
  }

  .pool {
    display: contents;
  }

  .pool-empty-state {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
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
    width: var(--item-size, 5rem);
    height: var(--item-size, 5rem);
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
