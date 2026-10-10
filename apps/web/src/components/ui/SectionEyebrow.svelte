<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<p class="text-secondary mb-4 self-center font-mono text-sm font-light">
  {@render children()}
</p>
