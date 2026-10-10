<script lang="ts">
  /**
   * A stack of hairlines fading from fully opaque to transparent, used to
   * soften the transition between two sections.
   *
   * `pinned` renders the first line absolutely positioned flush with the
   * top of a padded wrapper, used when the divider needs to sit above
   * section padding rather than in normal flow.
   */
  let {
    tone = 'muted',
    pinned = false,
    class: className = ''
  }: {
    tone?: 'muted' | 'secondary';
    pinned?: boolean;
    class?: string;
  } = $props();
</script>

{#if tone === 'muted'}
  {#if pinned}
    <div class={`relative w-full ${className}`}>
      <hr class="border-muted absolute top-0 left-0 z-2 my-0 w-full border-t" />
      <hr class="border-muted/80 my-1 w-full border-t" />
      <hr class="border-muted/60 my-1 w-full border-t" />
      <hr class="border-muted/40 my-1 w-full border-t" />
      <hr class="border-muted/20 my-1 w-full border-t" />
    </div>
  {:else}
    <div class={className}>
      <hr class="border-muted mt-0 mb-1 border-t" />
      <hr class="border-muted/80 my-0.5 border-t" />
      <hr class="border-muted/60 my-0.5 border-t" />
      <hr class="border-muted/40 my-0.5 border-t" />
      <hr class="border-muted/20 my-0.5 border-t" />
    </div>
  {/if}
{:else if pinned}
  <div class={`relative w-full ${className}`}>
    <hr class="border-secondary absolute top-0 left-0 z-2 my-0 w-full border-t" />
    <hr class="border-secondary/80 my-1 w-full border-t" />
    <hr class="border-secondary/60 my-1 w-full border-t" />
    <hr class="border-secondary/40 my-1 w-full border-t" />
    <hr class="border-secondary/20 my-1 w-full border-t" />
  </div>
{:else}
  <div class={className}>
    <hr class="border-secondary mt-0 mb-1 border-t" />
    <hr class="border-secondary/80 my-0.5 border-t" />
    <hr class="border-secondary/60 my-0.5 border-t" />
    <hr class="border-secondary/40 my-0.5 border-t" />
    <hr class="border-secondary/20 my-0.5 border-t" />
  </div>
{/if}
