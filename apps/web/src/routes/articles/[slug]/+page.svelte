<script lang="ts">
  import Markdown from '@ksi-core/ui/platform/Markdown.svelte';
  import { locale } from '$lib/locale.svelte';
  let { data } = $props<{ data: import('./$types').PageData }>();
</script>

<svelte:head><title>{data.article.title} · KSI UWr</title></svelte:head>
<main class="page-gutter mx-auto max-w-4xl py-12">
  <a class="btn btn-outline mb-6" href="/articles">All articles</a>
  <h1 class="mb-6 text-4xl font-bold">{data.article.title}</h1>
  {#if data.article.authors.length}<div class="mb-8 flex flex-wrap gap-4">
      {#each data.article.authors as author}<a
          class="btn btn-outline"
          href={`/members/${encodeURIComponent(author.id)}`}>{author.name}</a
        >{/each}
    </div>{/if}
  <Markdown blocks={data.blocks} language={locale.current === 'pl' ? 'pl' : 'en'} />
</main>
