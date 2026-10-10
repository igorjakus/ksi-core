<script lang="ts">
  /**
   * A GitHub repository preview card: an Open Graph screenshot on one side
   * with a "View on GitHub" hover overlay, and a short blurb on the other.
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
  class="grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-[1fr_2fr] md:gap-8 lg:px-32"
>
  <a
    {href}
    target="_blank"
    rel="noopener noreferrer"
    class="group relative overflow-hidden rounded-2xl"
  >
    <div
      class="bg-base-content/70 pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl opacity-0 transition-all group-hover:scale-x-[0.99] group-hover:scale-y-[0.98] group-hover:opacity-100"
    >
      <p>View in GitHub</p>
    </div>
    <img
      src={image}
      alt=""
      class="rounded-2xl transition-transform group-hover:scale-x-[0.99] group-hover:scale-y-[0.98]"
      style="width:100%;height:100%;object-fit:cover;display:block"
    />
  </a>
  <div class="text-md basis-2 space-y-4">
    <h2>{title}</h2>
    <p>{description}</p>
  </div>
</div>
