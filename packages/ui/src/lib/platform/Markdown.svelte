<script lang="ts">
  import { tick } from 'svelte';
  import { X, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import type { MarkdownBlock } from 'shared/markdown';
  let { blocks, language = 'pl' }: { blocks: MarkdownBlock[]; language?: 'pl' | 'en' } = $props();

  let dialog = $state<HTMLDialogElement>();
  function close() {
    dialog?.close();
    active = null;
  }
  $effect(() => {
    if (active) {
      void tick().then(() => {
        if (dialog && !dialog.open) dialog.showModal();
      });
    }
  });
  let active = $state<{ ids: string[]; index: number } | null>(null);
</script>

<div class="markdown">
  {#each blocks as block}{#if block.type === 'html'}{@html block.html}{:else}<div class="gallery">
        {#each block.ids.slice(0, block.preview) as id, index}<button
            type="button"
            onclick={() => (active = { ids: block.ids, index })}
            aria-label={`${'Open image'} ${index + 1}`}
            ><img
              src={`/media/${id}`}
              alt={`${'Gallery image'} ${index + 1}`}
              loading="lazy"
            /></button
          >{/each}{#if block.ids.length > block.preview}<button
            type="button"
            onclick={() => (active = { ids: block.ids, index: block.preview })}
            >+{block.ids.length - block.preview}</button
          >{/if}
      </div>{/if}{/each}
</div>
{#if active}<dialog
    bind:this={dialog}
    aria-label={'Gallery'}
    class="lightbox"
    oncancel={(event) => {
      event.preventDefault();
      close();
    }}
  >
    <button type="button" onclick={close}><X size={16} aria-hidden="true" />{'Close'}</button>
    <div class="row">
      <button
        type="button"
        onclick={() =>
          (active = {
            ids: active!.ids,
            index: (active!.index - 1 + active!.ids.length) % active!.ids.length
          })}
        aria-label={'Previous image'}><ChevronLeft size={20} aria-hidden="true" /></button
      ><img
        src={`/media/${active.ids[active.index]}`}
        alt={`${'Gallery image'} ${active.index + 1}`}
      /><button
        type="button"
        onclick={() =>
          (active = { ids: active!.ids, index: (active!.index + 1) % active!.ids.length })}
        aria-label={'Next image'}><ChevronRight size={20} aria-hidden="true" /></button
      >
    </div>
  </dialog>{/if}

<style>
  .markdown {
    overflow-wrap: anywhere;
  }
  .markdown :global(pre) {
    background: var(--surface-muted, #edf1ed);
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
    border: 1px solid var(--line, #acbdb4);
    border-radius: 12px;
    background: var(--surface, white);
    color: var(--ink, #272638);
    padding: 20px;
  }
  .lightbox::backdrop {
    background: #0009;
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
