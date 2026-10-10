<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * An alternating image/text row used to tell the story of a single
   * project or initiative. The last couple of paragraphs fade out under a
   * mask with a "continue reading" link floating over them, teasing the
   * full write-up without dumping all the copy on the landing page.
   */
  let {
    title,
    image,
    reverse = false,
    readMoreHref,
    readMoreLabel = 'continue reading',
    lead,
    fade
  }: {
    title: string;
    image: { src: string; alt: string };
    reverse?: boolean;
    readMoreHref: string;
    readMoreLabel?: string;
    lead: Snippet;
    fade: Snippet;
  } = $props();
</script>

{#snippet textBlock()}
  <div class="text-md basis-2 space-y-4">
    <h2>{title}</h2>
    {@render lead()}
    <div class="relative h-max">
      <div class="space-y-4 mask-b-from-0">
        {@render fade()}
      </div>
      <div
        class="absolute bottom-0 z-1 flex w-full translate-y-8 flex-col items-center self-center"
      >
        <a class="underline" href={readMoreHref}>{readMoreLabel}</a>
      </div>
    </div>
  </div>
{/snippet}

{#snippet imageBlock()}
  <img class="border-secondary/20 basis-1 rounded-md border-4" src={image.src} alt={image.alt} />
{/snippet}

<div class="grid w-full grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-8 lg:px-32">
  {#if reverse}
    {@render imageBlock()}
    {@render textBlock()}
  {:else}
    {@render textBlock()}
    {@render imageBlock()}
  {/if}
</div>
