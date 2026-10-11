<script lang="ts">
  import Markdown from '@ksi-core/ui/platform/Markdown.svelte';
  import { locale } from '$lib/locale.svelte';
  import { Shield, Plus } from '@lucide/svelte';

  let { data, form } = $props<{
    data: import('./$types').PageData;
    form: import('./$types').ActionData;
  }>();
  let project = $derived(data.project);
  let user = $derived(data.user);
</script>

<div class="page-gutter py-12">
  <div class="mb-8 flex flex-wrap items-center justify-between gap-6">
    <h1 class="text-4xl font-bold">{project.name}</h1>

    <div class="flex flex-wrap gap-4">
      {#if user?.membershipStatus === 'active'}
        {#if data.access.canEdit || data.access.canManageMembers}
          <a
            href={`${data.dashboardOrigin}/projects/${encodeURIComponent(project.slug)}/settings`}
            class="btn btn-outline gap-2"><Shield class="size-4" /> Project settings</a
          >
        {/if}
        {#if !data.access.isMember && !form?.joined}
          <form method="POST" action="?/join">
            <button class="btn btn-primary gap-2"><Plus class="size-4" /> Join project</button>
          </form>
        {:else if data.access.isMember}
          <a
            href={`${data.dashboardOrigin}/projects/${encodeURIComponent(project.slug)}`}
            class="btn btn-outline gap-2">Open project workspace</a
          >
        {/if}
      {/if}
    </div>
  </div>

  {#if form?.joined}<p role="status">
      {form.requested ? 'Your join request has been sent.' : 'You have joined the project.'}
    </p>{/if}
  {#if form && 'message' in form}<p role="alert">{form.message}</p>{/if}
  <div class="prose max-w-none">
    <p class="text-base-content/80 mb-8 text-xl">{project.description}</p>

    {#if project.tags?.length > 0}
      <div class="mb-8 flex gap-2">
        {#each project.tags as tag}
          <span class="badge badge-neutral">{tag}</span>
        {/each}
      </div>
    {/if}

    {#each project.sections as section}
      {#if section.type === 'main-article' && project.mainArticle}
        <section class="my-10">
          <h2 class="mb-6 text-2xl font-semibold">{project.mainArticle.title}</h2>
          <Markdown
            blocks={data.mainArticleBlocks}
            language={locale.current === 'pl' ? 'pl' : 'en'}
          />
        </section>
      {:else if section.type === 'articles'}
        <section class="my-10">
          <h2 class="mb-6 text-2xl font-semibold">Articles</h2>
          {#each project.articles as article}<a
              class="border-base-content/20 hover:border-base-content mb-3 block rounded border px-5 py-4"
              href={`/articles/${encodeURIComponent(article.slug)}`}>{article.title}</a
            >{/each}
        </section>
      {:else if section.type === 'leaders' || section.type === 'members'}
        <section class="my-10">
          <h2 class="mb-6 text-2xl font-semibold">
            {section.type === 'leaders' ? 'Project leaders' : 'Members'}
          </h2>
          <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {#each section.type === 'leaders' ? project.leaders : project.members as member}<a
                class="border-base-content/20 hover:border-base-content flex items-center gap-3 rounded border px-4 py-4"
                href={`/members/${encodeURIComponent(member.id)}`}
                >{#if member.image}<img
                    class="h-10 w-10 rounded-full object-cover"
                    src={member.image}
                    alt=""
                  />{/if}<span
                  >{member.name}{#if member.nickname}<small class="block"
                      >aka. {member.nickname}</small
                    >{/if}</span
                ></a
              >{/each}
          </div>
        </section>
      {:else if section.type === 'links'}
        <section class="my-10">
          <h2 class="mb-6 text-2xl font-semibold">Links</h2>
          <div class="flex flex-wrap gap-3">
            {#each project.links as link}<a
                class="btn btn-outline"
                href={link.url}
                rel="noopener noreferrer">{link.label}</a
              >{/each}
          </div>
        </section>
      {/if}
    {/each}
  </div>
</div>
