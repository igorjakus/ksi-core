<script lang="ts">
  import '@ksi-core/ui/platform.css';
  import '@ksi-core/ui/platform-theme.css';
  import '$lib/auth.css';
  import { onMount } from 'svelte';
  import { initializePreferences } from '@ksi-core/ui/platform/preferences';
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
