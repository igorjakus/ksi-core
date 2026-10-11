<script lang="ts">
  import '../app.css';
  import { onMount, untrack } from 'svelte';
  import Navbar from '../components/Navbar.svelte';
  import Sidebar from '../components/Sidebar.svelte';
  import Footer from '../components/Footer.svelte';
  import { Toaster } from 'svelte-sonner';
  import { themeStore } from '@ksi-core/ui/lib';
  import Alert from '../components/Alert.svelte';
  import '../locales/main.loader.svelte.js';
  import { locale, refreshLocalizedContent } from '$lib/locale.svelte';

  onMount(themeStore.initialize);
  $effect(() => {
    const current = locale.current;
    untrack(() => void refreshLocalizedContent(current));
  });

  const { children, data } = $props();
</script>

<svelte:head>
  <title>KSI UWr</title>
</svelte:head>

<Toaster theme={$themeStore} richColors />

<div class="relative flex min-h-screen flex-col">
  {#if data.alert}
    <div class="w-full lg:hidden">
      <Alert alert={data.alert} />
    </div>
  {/if}
  <Navbar user={data.user} alert={data.alert} session={data.session} />
  <Sidebar user={data.user} session={data.session} />

  <div class="bg-base-100 flex min-h-screen flex-1 flex-col pt-14">
    {@render children?.()}
  </div>
  <Footer />
</div>
