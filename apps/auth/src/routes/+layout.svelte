<script lang="ts">
  import '@ksi-core/ui/platform.css';
  import '@ksi-core/ui/platform-theme.css';
  import '$lib/auth.css';
  import {onMount} from 'svelte';
  import {initializePreferences} from '@ksi-core/ui/platform/preferences';
  onMount(initializePreferences);
  let { children } = $props();
</script>

{@render children()}
