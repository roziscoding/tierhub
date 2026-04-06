<script lang='ts'>
  import type { Template } from '$lib/db'

  import { dev } from '$app/environment'
  import { base } from '$app/paths'
  import Button from '$lib/components/Button.svelte'
  import { clearAll, listTemplates } from '$lib/db'
  import { onMount } from 'svelte'

  let templates: Template[] = $state([])

  async function handleClearData() {
    await clearAll()
    templates = []
  }

  function textColor(bg: string): string {
    const hex = bg.replace('#', '')
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.5 ? '#000' : '#fff'
  }

  onMount(async () => {
    templates = await listTemplates()
  })
</script>

<div class='home'>
  <header>
    <h1>TierHub</h1>
    <p class='subtitle'>Create and share tier lists</p>
  </header>

  <div class='actions'>
    <a href='{base}/tierlist' class='card'>
      <h2>Single Use Tier List</h2>
      <p>Create a tier list from scratch. Add images, drag them into tiers, and rank away.</p>
      <span class='cta'>
        <Button>Get Started</Button>
      </span>
    </a>

    <a href='{base}/template' class='card'>
      <h2>Create Template</h2>
      <p>Set up tiers and a pool of images that others can use as a starting point.</p>
      <span class='cta'>
        <Button>Create Template</Button>
      </span>
    </a>
  </div>

  {#if templates.length > 0}
    <section class='templates'>
      <h2 class='section-title'>Templates</h2>
      <ul class='template-list'>
        {#each templates as template (template.id)}
          <li>
            <a href='{base}/template/{template.id}' class='template-card'>
              <span class='template-title'>{template.title}</span>
              {#if template.description}
                <span class='template-desc'>{template.description}</span>
              {/if}
              <div class='template-tiers'>
                {#each template.tiers as tier}
                  <span class='template-tier-badge' style='background: {tier.color}; color: {textColor(tier.color)}'>
                    {tier.label}
                  </span>
                {/each}
              </div>
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if dev}
    <Button variant='danger' confirm='Are you sure?' onclick={handleClearData}>Clear all data</Button>
  {/if}
</div>

<style>
  .home {
    width: 80%;
    max-width: 50rem;
    margin: 0 auto;
    padding: 4rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
  }

  header {
    text-align: center;
  }

  h1 {
    font-size: 2.5rem;
    margin: 0;
    color: var(--color-primary);
  }

  .subtitle {
    margin: 0.5rem 0 0;
    color: var(--color-text-muted);
    font-size: 1rem;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    width: 100%;
  }

  .card {
    background: var(--color-surface);
    border: 0.0625rem solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 2rem;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: border-color 0.15s, background 0.15s;
  }

  .card:hover {
    border-color: var(--color-border-hover);
    background: var(--color-surface-raised);
  }

  .card h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-text);
  }

  .card p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    line-height: 1.5;
    flex: 1;
  }

  .cta {
    margin-top: 0.5rem;
  }

  .templates {
    width: 100%;
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

  .template-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .template-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-decoration: none;
    color: inherit;
    background: var(--color-surface);
    border: 0.0625rem solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.25rem 1.5rem;
    transition: border-color 0.15s, background 0.15s;
  }

  .template-card:hover {
    border-color: var(--color-border-hover);
    background: var(--color-surface-raised);
  }

  .template-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .template-desc {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    line-height: 1.4;
  }

  .template-tiers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: 0.25rem;
  }

  .template-tier-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-sm);
    line-height: 1.4;
  }

</style>
