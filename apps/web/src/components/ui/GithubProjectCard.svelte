<script lang="ts">
  import { ArrowUpRight } from '@lucide/svelte';

  /**
   * A GitHub repository preview card: an Open Graph screenshot framed with
   * the same hairline/mono language as the rest of the site, topped with a
   * label strip that always names the destination instead of hiding it
   * behind a hover-only overlay.
   */
  let {
    repo,
    title,
    description
  }: {
    repo: string;
    title: string;
    description: string;
  } = $props();

  const href = $derived(`https://github.com/${repo}`);
  const image = $derived(`https://opengraph.githubassets.com/1/${repo}`);
</script>

<div
  class="grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-[1fr_2fr] md:gap-12 lg:px-32"
>
  <a
    {href}
    target="_blank"
    rel="noopener noreferrer"
    class="group border-base-content/15 bg-base-200 relative block overflow-hidden border"
  >
    <img
      src={image}
      alt=""
      class="aspect-video w-full object-cover grayscale-[40%] transition-all duration-300 group-hover:grayscale-0"
    />
    <div
      class="border-base-content/15 bg-base-100 flex items-center justify-between gap-3 border-t px-4 py-2.5 font-mono text-[11px] tracking-[0.08em] uppercase"
    >
      <span class="text-base-content/50 truncate">{repo}</span>
      <span class="text-primary flex shrink-0 items-center gap-1.5">
        View on GitHub
        <ArrowUpRight
          class="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </span>
    </div>
  </a>
  <div class="text-md basis-2 space-y-4">
    <h2>{title}</h2>
    <p>{description}</p>
  </div>
</div>
