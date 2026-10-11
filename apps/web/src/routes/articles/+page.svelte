<script lang="ts">
  import ArticleList from '$lib/components/ArticleList.svelte';
  let { data } = $props<{ data: import('./$types').PageData }>();
</script>

<main class="page-gutter mx-auto w-full max-w-4xl py-12">
  <h1 class="mb-8 text-4xl font-bold">Articles</h1>
  <ArticleList articles={data.articles} />
</main>
