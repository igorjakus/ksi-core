<script lang="ts">
  let { data } = $props<{ data: import('./$types').PageData }>();
</script>

<main class="page-gutter mx-auto max-w-4xl py-12">
  <h1 class="mb-8 text-4xl font-bold">Articles</h1>
  {#each data.articles as article}<a
      class="border-base-content/20 hover:border-base-content mb-4 flex items-center justify-between rounded border px-6 py-5"
      href={`/articles/${encodeURIComponent(article.slug)}`}
      ><h2 class="text-xl font-semibold">{article.title}</h2>
      <span aria-hidden="true">↗</span></a
    >{:else}<p>No published articles yet.</p>{/each}
</main>
