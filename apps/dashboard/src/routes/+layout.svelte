<script lang="ts">
  import '@ksi-core/ui/platform.css';
  import '@ksi-core/ui/platform-theme.css';
  import '$lib/dashboard.css';
  import { onMount } from 'svelte';
  import { initializePreferences } from '$lib/preferences.svelte';
  onMount(initializePreferences);
  let { children } = $props();
</script>

{@render children()}
