<script lang="ts">
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

    <div class="mt-8">
      <h2 class="mb-4 text-2xl font-semibold">About the Project</h2>
      <!-- Fallback empty state for content -->
      <p class="text-base-content/60">Full project details and articles will be displayed here.</p>
    </div>
  </div>
</div>
