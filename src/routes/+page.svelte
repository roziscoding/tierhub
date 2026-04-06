<script lang='ts'>
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

  const DEFAULT_TIERS: { label: string, color: string, items: string[] }[] = [
    { label: 'S', color: '#FF6B6B', items: [] },
    { label: 'A', color: '#FFB347', items: [] },
    { label: 'B', color: '#FFFF66', items: [] },
    { label: 'C', color: '#66FF66', items: [] },
    { label: 'F', color: '#6666FF', items: [] },
  ]

  const tiers = $state(structuredClone(DEFAULT_TIERS))
  const pool = $state<string[]>([])
  let dragItem = $state<{ source: 'pool' | number, index: number } | null>(null)
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
    tiers.push({ label: String.fromCharCode(65 + tiers.length), color: nextColor, items: [] })
  }

  function removeTier(index: number) {
    pool.push(...tiers[index].items)
    tiers.splice(index, 1)
  }

  function handleFiles(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const files = input.files
    if (!files)
      return
    for (const file of files) {
      if (!file.type.startsWith('image/'))
        continue
      const reader = new FileReader()
      reader.onload = () => {
        pool.push(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    input.value = ''
  }

  function onDragStart(source: 'pool' | number, index: number) {
    dragItem = { source, index }
  }

  function onDropOnTier(tierIndex: number) {
    if (!dragItem)
      return
    let item: string
    if (dragItem.source === 'pool') {
      item = pool.splice(dragItem.index, 1)[0]
    }
    else {
      item = tiers[dragItem.source].items.splice(dragItem.index, 1)[0]
    }
    tiers[tierIndex].items.push(item)
    dragItem = null
  }

  function onDropOnPool() {
    if (!dragItem)
      return
    if (dragItem.source === 'pool') {
      dragItem = null
      return
    }
    const item = tiers[dragItem.source].items.splice(dragItem.index, 1)[0]
    pool.push(item)
    dragItem = null
  }

  function allowDrop(e: DragEvent) {
    e.preventDefault()
  }

  function startEditLabel(index: number) {
    editingTier = index
    editingLabel = tiers[index].label
  }

  function finishEditLabel() {
    if (editingTier !== null) {
      tiers[editingTier].label = editingLabel || tiers[editingTier].label
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

  function moveTier(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= tiers.length)
      return;
    [tiers[index], tiers[target]] = [tiers[target], tiers[index]]
  }

  function openLightbox(src: string) {
    lightboxSrc = src
  }

  function closeLightbox() {
    lightboxSrc = null
  }
</script>

<svelte:window onkeydown={e => e.key === 'Escape' && closeLightbox()} />

<div class='app'>
  <header>
    <h1>TierHub</h1>
    <p class='subtitle'>Drag and drop images into tiers</p>
  </header>

  <div class='tierlist'>
    {#each tiers as tier, i}
      <div class='tier-row' role='listitem' ondragover={allowDrop} ondrop={() => onDropOnTier(i)}>
        <div class='tier-label' style='background: {tier.color}; color: {textColor(tier.color)}'>
          <div class='tier-controls-top'>
            <button class='tier-move' onclick={() => moveTier(i, -1)} disabled={i === 0} title='Move up'>&uarr;</button>
            <button class='tier-move' onclick={() => moveTier(i, 1)} disabled={i === tiers.length - 1} title='Move down'>&darr;</button>
          </div>
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
            <button class='label-text' ondblclick={() => startEditLabel(i)}>{tier.label}</button>
          {/if}
          <div class='tier-controls-bottom'>
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
        <div class='tier-items'>
          {#each tier.items as item, j}
            <div
              class='item'
              draggable='true'
              ondragstart={() => onDragStart(i, j)}
              role='listitem'
            >
              <button class='item-img-btn' onclick={() => openLightbox(item)}>
                <img src={item} alt='' class='item-img' />
              </button>
              <button class='item-remove' onclick={() => removeItemFromTier(i, j)}>&times;</button>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if tiers.length < 10}
    <button class='add-tier-btn' onclick={addTier}>+ Add Tier</button>
  {/if}

  <div class='pool-section'>
    <h2>Images</h2>
    <div class='add-item'>
      <input
        bind:this={fileInput}
        type='file'
        accept='image/*'
        multiple
        onchange={handleFiles}
        hidden
      />
      <button class='upload-btn' onclick={() => fileInput?.click()}>Choose Images...</button>
    </div>
    <div class='pool' role='list' ondragover={allowDrop} ondrop={onDropOnPool}>
      {#each pool as item, i}
        <div
          class='item'
          draggable='true'
          ondragstart={() => onDragStart('pool', i)}
          role='listitem'
        >
          <button class='item-img-btn' onclick={() => openLightbox(item)}>
            <img src={item} alt='' class='item-img' />
          </button>
          <button class='item-remove' onclick={() => removeItemFromPool(i)}>&times;</button>
        </div>
      {:else}
        <p class='pool-empty'>Upload images above, then drag them into tiers</p>
      {/each}
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
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }

  header {
    text-align: center;
    margin-bottom: 24px;
  }

  h1 {
    font-size: 2rem;
    margin: 0;
    background: linear-gradient(90deg, #FF6B6B, #FFB347, #FFFF66, #66FF66, #6666FF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    margin: 4px 0 0;
    color: #888;
    font-size: 0.9rem;
  }

  .tierlist {
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid #333;
  }

  .tier-row {
    display: flex;
    min-height: 80px;
    background: #16213e;
  }

  .tier-label {
    width: 100px;
    min-width: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.5rem;
    position: relative;
    padding: 4px;
    gap: 2px;
  }

  .label-text {
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .label-text:hover {
    background: rgba(0,0,0,0.15);
  }

  .label-input {
    width: 60px;
    text-align: center;
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(0,0,0,0.3);
    border-radius: 4px;
    font-size: 1.2rem;
    font-weight: bold;
    padding: 2px;
  }

  .tier-controls-top,
  .tier-controls-bottom {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .tier-row:hover .tier-controls-top,
  .tier-row:hover .tier-controls-bottom {
    opacity: 1;
  }

  .tier-move,
  .tier-remove {
    background: rgba(0,0,0,0.25);
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 0.7rem;
    padding: 1px 5px;
    border-radius: 3px;
    line-height: 1;
  }

  .tier-move:hover,
  .tier-remove:hover {
    background: rgba(0,0,0,0.45);
  }

  .tier-move:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .color-swatch-btn {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0,0,0,0.3);
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
  }

  .color-swatch-btn:hover {
    border-color: rgba(0,0,0,0.6);
  }

  .color-popover {
    position: absolute;
    left: 105px;
    top: 50%;
    transform: translateY(-50%);
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 8px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    z-index: 10;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  }

  .palette-color {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #444;
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
    box-shadow: 0 0 0 2px #fff;
  }

  .tier-items {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    padding: 6px;
    gap: 6px;
    min-height: 80px;
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
    border-radius: 4px;
    overflow: hidden;
  }

  .item-img {
    width: 70px;
    height: 70px;
    object-fit: cover;
    display: block;
    border-radius: 4px;
  }

  .item-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    background: rgba(0,0,0,0.7);
    border: none;
    color: #fff;
    cursor: pointer;
    font-size: 0.8rem;
    width: 18px;
    height: 18px;
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
    background: #ff4444;
  }

  .add-tier-btn {
    margin-top: 8px;
    padding: 8px 20px;
    background: #2a2a4a;
    color: #ccc;
    border: 1px dashed #555;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    width: 100%;
  }

  .add-tier-btn:hover {
    background: #333366;
    border-color: #777;
  }

  .pool-section {
    margin-top: 32px;
  }

  .pool-section h2 {
    margin: 0 0 12px;
    font-size: 1.1rem;
    color: #aaa;
  }

  .add-item {
    margin-bottom: 12px;
  }

  .upload-btn {
    padding: 10px 20px;
    background: #4a4aff;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .upload-btn:hover {
    background: #5c5cff;
  }

  .pool {
    min-height: 80px;
    background: #16213e;
    border: 2px dashed #333;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pool-empty {
    color: #555;
    margin: 0;
    font-size: 0.85rem;
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
    top: 20px;
    right: 24px;
    background: none;
    border: none;
    color: #fff;
    font-size: 2rem;
    cursor: pointer;
    line-height: 1;
  }

  .lightbox-close:hover {
    color: #ff4444;
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
    border-radius: 8px;
  }
</style>
