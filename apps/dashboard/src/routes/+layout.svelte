<script lang="ts">
  import '@ksi-core/ui/platform.css';
  import '@ksi-core/ui/platform-theme.css';
  import '$lib/dashboard.css';
  import { onMount } from 'svelte';
  import { initializePreferences } from '$lib/preferences.svelte';
  import { loadLocale } from 'wuchale/load-utils';
  import '../locales/main.loader.svelte.js';
  import { locale } from '$lib/locale.svelte';

  onMount(initializePreferences);
  $effect(() => {
    loadLocale(locale.current);
  });
  let { children } = $props();
</script>

{@render children()}
