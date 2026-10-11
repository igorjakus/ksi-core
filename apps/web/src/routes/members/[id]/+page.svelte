<script lang="ts">
  import { Github, Linkedin } from '@lucide/svelte';
  let { data } = $props<{ data: import('./$types').PageData }>();
</script>

<svelte:head><title>{data.member.name} · KSI UWr</title></svelte:head>
<main class="page-gutter mx-auto max-w-3xl py-12">
  <a href="/projects" class="btn btn-outline mb-8">Projects</a>
  <div class="flex flex-wrap items-center gap-6">
    {#if data.member.image}<img
        class="h-24 w-24 rounded-full object-cover"
        src={data.member.image}
        alt=""
      />{/if}
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
        rel="noopener noreferrer"><Github size={16} />GitHub</a
      >{/if}{#if data.member.linkedin}<a
        class="btn btn-outline gap-2"
        href={data.member.linkedin}
        rel="noopener noreferrer"><Linkedin size={16} />LinkedIn</a
      >{/if}
  </div>
</main>
