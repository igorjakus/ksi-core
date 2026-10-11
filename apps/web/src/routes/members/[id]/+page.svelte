<script lang="ts">
  import ArticleList from '$lib/components/ArticleList.svelte';
  import { Github, Linkedin } from '@lucide/svelte';
  let { data } = $props<{ data: import('./$types').PageData }>();
</script>

<svelte:head><title>{data.member.name} · KSI UWr</title></svelte:head>
<main class="member-page page-gutter">
  <div class="flex flex-wrap items-center gap-6">
    {#if data.member.image}<img
        class="h-24 w-24 rounded-full object-cover"
        src={data.member.image}
        alt=""
      />{:else}<span class="profile-initials" aria-hidden="true"
        >{data.member.name
          .split(/\s+/)
          .filter(Boolean)
          .filter(
            (_: string, index: number, words: string[]) => index === 0 || index === words.length - 1
          )
          .map((word: string) => word[0])
          .join('')
          .toUpperCase()}</span
      >{/if}
    <div>
      <h1 class="text-4xl font-bold">{data.member.name}</h1>
      {#if data.member.nickname}<p class="mt-2">aka. {data.member.nickname}</p>{/if}
    </div>
  </div>
  {#if data.member.bio}<p class="my-8 whitespace-pre-wrap">{data.member.bio}</p>{/if}
  <div class="mt-6 flex gap-3">
    {#if data.member.github}<a
        class="btn btn-outline gap-2"
        href={data.member.github}
        target="_blank"
        rel="noopener noreferrer"><Github size={16} />GitHub</a
      >{/if}{#if data.member.linkedin}<a
        class="btn btn-outline gap-2"
        href={data.member.linkedin}
        target="_blank"
        rel="noopener noreferrer"><Linkedin size={16} />LinkedIn</a
      >{/if}
  </div>
  <section class="member-articles" aria-labelledby="member-articles-heading">
    <h2 id="member-articles-heading">Articles</h2>
    <ArticleList articles={data.member.articles} />
  </section>
</main>

<style>
  .member-page {
    width: 100%;
    min-inline-size: min(100%, 36rem);
    max-width: 1000px;
    margin-inline: auto;
    padding-top: 48px;
    padding-bottom: 72px;
  }
  h1 {
    overflow-wrap: anywhere;
    letter-spacing: -0.035em;
  }
  .profile-initials {
    display: grid;
    place-items: center;
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: var(--surface-muted);
    font-size: 28px;
    flex-shrink: 0;
  }
  .member-articles {
    margin-top: 40px;
    padding-top: 32px;
    border-top: 1px solid var(--line);
  }
  h2 {
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.025em;
    margin-bottom: 24px;
  }
  @media (max-width: 600px) {
    .member-page {
      padding-top: 28px;
      padding-bottom: 40px;
    }
  }
</style>
