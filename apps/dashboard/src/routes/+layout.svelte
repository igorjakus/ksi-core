<script lang="ts">
  import '@ksi-core/ui/platform.css';
  import '@ksi-core/ui/platform-theme.css';
  import '$lib/dashboard.css';
  import { onMount } from 'svelte';
  import { initializePreferences, preferences } from '$lib/preferences.svelte';
  import { loadLocale } from 'wuchale/load-utils';
  import '../locales/main.loader.svelte.js';

  onMount(initializePreferences);
  $effect(() => {
    loadLocale(preferences.language === 'en' ? 'en-us' : 'pl');
  });
  let { children } = $props();
</script>

{@render children()}
