<script lang='ts'>
  const {
    src,
    removable = false,
    onlightbox,
    onremove,
    onmiddleclick,
  }: {
    src: string
    removable?: boolean
    onlightbox?: () => void
    onremove?: () => void
    onmiddleclick?: () => void
  } = $props()

  function handleAuxClick(e: MouseEvent) {
    if (e.button === 1) {
      e.preventDefault()
      onmiddleclick?.()
    }
  }
</script>

<div class='item'>
  <button class='item-img-btn' onclick={onlightbox} onauxclick={handleAuxClick}>
    <img {src} alt='' class='item-img' />
  </button>
  {#if removable && onremove}
    <button class='item-remove' onclick={onremove}>&times;</button>
  {/if}
</div>

<style>
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
    width: var(--item-size, 5rem);
    height: var(--item-size, 5rem);
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
</style>
