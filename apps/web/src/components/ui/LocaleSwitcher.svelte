<script lang="ts">
  import { getAvailableLocales, locale, setLocale } from '$lib/locale.svelte';

  /**
   * A segmented locale switcher: every locale is shown as its own button,
   * so picking one is a single click instead of "open menu, then pick".
   * With only a couple of locales this is both simpler to build and faster
   * to use than a dropdown.
   */
  let { class: className = '' }: { class?: string } = $props();

  let availableLocales = $derived(getAvailableLocales());
</script>

<div
  class={`border-base-200 flex h-full items-center divide-x divide-dashed ${className}`}
  role="group"
  aria-label="Change language"
>
  {#each availableLocales as option (option.code)}
    <button
      type="button"
      onclick={() => setLocale(option.code)}
      aria-pressed={locale.current === option.code}
      title={option.formattedLocale}
      class={[
        'flex h-full items-center gap-1.5 px-3 text-sm font-medium transition-colors duration-150',
        locale.current === option.code
          ? 'bg-primary text-primary-content'
          : 'text-base-content/60 hover:text-base-content hover:bg-base-200/60'
      ]}
    >
      <span class="select-none" aria-hidden="true">{option.emoji}</span>
      <span class="uppercase">{option.code.split('-')[0]}</span>
    </button>
  {/each}
</div>
