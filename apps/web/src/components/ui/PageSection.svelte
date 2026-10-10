<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * A full-bleed band with the noise texture + guide lines used throughout
   * the landing page. Centralizing it keeps every band's padding and
   * decoration in sync, so new sections automatically match.
   */
  let {
    guide = 'none',
    id,
    class: className = '',
    children
  }: {
    guide?: 'hero' | 'content-strong' | 'content-soft' | 'none';
    id?: string;
    class?: string;
    children: Snippet;
  } = $props();
</script>

<div {id} class={`relative flex h-full w-full flex-col items-center ${className}`}>
  {@render children()}
</div>
