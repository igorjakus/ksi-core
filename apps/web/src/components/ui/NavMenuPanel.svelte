<script lang="ts">
  import { ArrowRight, ArrowUpRight } from '@lucide/svelte';
  import type { Component } from 'svelte';

  /**
   * The full-width panel rendered under a Navbar mega-menu trigger (Projects,
   * Groups, ...). Items render as a border-grid of cards, matching the same
   * pattern used on the /projects listing page.
   */
  let {
    items,
    columns = 3,
    moreHref,
    moreLabel = 'See more',
    onNavigate
  }: {
    items: {
      title: string;
      description: string;
      href: string;
      icon: Component;
      external?: boolean;
      badge?: string;
    }[];
    columns?: 3 | 4;
    moreHref?: string;
    moreLabel?: string;
    onNavigate?: () => void;
  } = $props();
</script>

<div
  class={[
    'border-base-content/15 bg-base-content/15 page-gutter grid w-full grid-cols-1 gap-px border-y sm:grid-cols-2',
    columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
  ]}
>
  {#each items as item (item.title)}
    <a
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      onclick={onNavigate}
      class="group bg-base-100 hover:bg-primary/8 focus-visible:outline-primary flex min-h-32 flex-col justify-between gap-4 p-5 transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 lg:min-h-52"
    >
      <div class="flex items-start justify-between">
        <item.icon class="text-primary size-5" strokeWidth={1.5} />
        {#if item.external}
          <ArrowUpRight
            class="text-base-content/30 group-hover:text-primary size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        {:else}
          <ArrowRight
            class="text-base-content/30 group-hover:text-primary size-4 transition-transform group-hover:translate-x-1"
          />
        {/if}
      </div>
      <div>
        <p class="font-anybody flex items-center gap-2 font-semibold">
          {item.title}
          {#if item.badge}
            <span
              class="text-base-content/50 border-base-content/20 border px-2 py-0.5 text-[0.6rem] font-medium tracking-wide uppercase"
              >{item.badge}</span
            >
          {/if}
        </p>
        <p class="text-base-content/55 mt-1 text-sm leading-relaxed">{item.description}</p>
      </div>
    </a>
  {/each}
  {#if moreHref}
    <a
      href={moreHref}
      onclick={onNavigate}
      class="group bg-base-200/60 hover:bg-primary/8 focus-visible:outline-primary flex min-h-32 flex-col items-center justify-center gap-2 p-5 text-center transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 lg:min-h-52"
    >
      <span class="font-anybody font-semibold">{moreLabel}</span>
      <ArrowRight
        class="text-base-content/40 group-hover:text-primary size-4 transition-transform group-hover:translate-x-1"
      />
    </a>
  {/if}
</div>
