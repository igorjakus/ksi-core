<script lang="ts">
  import type { MarkdownBlock } from 'shared/markdown';
  let { blocks }: { blocks: MarkdownBlock[] } = $props();
  let active = $state<{ ids: string[]; index: number } | null>(null);
</script>

<div class="markdown">
  {#each blocks as block}{#if block.type === 'html'}{@html block.html}{:else}<div class="gallery">
        {#each block.ids.slice(0, block.preview) as id, index}<button
            onclick={() => (active = { ids: block.ids, index })}
            aria-label={`Open image ${index + 1}`}
            ><img src={`/media/${id}`} alt={`Gallery image ${index + 1}`} loading="lazy" /></button
          >{/each}{#if block.ids.length > block.preview}<button
            onclick={() => (active = { ids: block.ids, index: block.preview })}
            >+{block.ids.length - block.preview}</button
          >{/if}
      </div>{/if}{/each}
</div>
{#if active}<dialog open aria-label="Gallery" class="lightbox">
    <button onclick={() => (active = null)}>Zamknij / Close</button>
    <div class="row">
      <button
        onclick={() =>
          (active = {
            ids: active!.ids,
            index: (active!.index - 1 + active!.ids.length) % active!.ids.length
          })}
        aria-label="Previous image">←</button
      ><img
        src={`/media/${active.ids[active.index]}`}
        alt={`Gallery image ${active.index + 1}`}
      /><button
        onclick={() =>
          (active = { ids: active!.ids, index: (active!.index + 1) % active!.ids.length })}
        aria-label="Next image">→</button
      >
    </div>
  </dialog>{/if}

<style>
  .markdown {
    overflow-wrap: anywhere;
  }
  .markdown :global(pre) {
    background: #edf1ed;
    padding: 16px;
    overflow: auto;
  }
  .markdown :global(img) {
    max-width: 100%;
    height: auto;
  }
  .gallery {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .gallery img {
    width: 100%;
    aspect-ratio: 1.3;
    object-fit: cover;
  }
  .gallery button {
    padding: 0;
  }
  .lightbox {
    position: fixed;
    inset: 0;
    z-index: 100;
    width: min(95vw, 1000px);
    max-height: 95vh;
    border: 1px solid #acbdb4;
    border-radius: 12px;
    background: white;
    padding: 20px;
    box-shadow: 0 0 0 100vmax #0009;
  }
  .lightbox img {
    max-height: 75vh;
    max-width: 70%;
    object-fit: contain;
  }
  @media (max-width: 600px) {
    .gallery {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
