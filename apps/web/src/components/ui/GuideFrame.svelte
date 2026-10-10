<script lang="ts">
  /**
   * Decorative vertical guide lines used to frame full-bleed marketing
   * sections (hero, story bands, footer). Keeping this in one place means
   * every section that wants "the KSI look" lines up on the same grid.
   */
  let {
    tone = 'hero'
  }: {
    tone?: 'hero' | 'content-strong' | 'content-soft';
  } = $props();
</script>

{#if tone === 'hero'}
  <div class="pointer-events-none absolute inset-0 hidden md:block">
    <div class="border-muted absolute top-0 left-8 h-full border-l border-dashed"></div>
    <div class="border-muted absolute top-0 right-8 h-full border-l border-dashed"></div>
  </div>
{:else if tone === 'content-strong'}
  <div class="pointer-events-none absolute inset-0 hidden md:block">
    <div class="border-base-content absolute top-0 left-8 h-full border-l"></div>
    <div class="border-base-content absolute top-0 right-8 h-full border-l"></div>
    <div class="bg-base-content/25 absolute top-0 left-0 h-full w-8"></div>
    <div class="bg-base-content/25 absolute top-0 right-0 h-full w-8"></div>
  </div>
{:else}
  <div class="pointer-events-none absolute inset-0 hidden md:block">
    <div class="border-muted/50 absolute top-0 left-8 h-full border-l"></div>
    <div class="border-muted/50 absolute top-0 right-8 h-full border-l"></div>
    <div class="bg-base-content/25 absolute top-0 left-0 h-full w-8"></div>
    <div class="bg-base-content/25 absolute top-0 right-0 h-full w-8"></div>
  </div>
{/if}
