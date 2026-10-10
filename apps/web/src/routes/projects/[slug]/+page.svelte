<script lang="ts">
  import { Shield, Plus } from '@lucide/svelte';
  
  let { data } = $props<{ data: import('./$types').PageData }>();
  let project = $derived(data.project);
  let user = $derived(data.user);
  let isMember = $derived(project.members?.some((m: any) => m.id === user?.id));
  let isLeader = $derived(project.members?.some((m: any) => m.id === user?.id && m.leader));
</script>

<div class="page-gutter py-12">
  <div class="flex items-center justify-between mb-8">
    <h1 class="text-4xl font-bold">{project.name}</h1>
    
    <div class="flex gap-4">
      {#if user?.membershipStatus === 'active'}
        {#if !isMember}
          <button class="btn btn-primary gap-2">
            <Plus class="size-4" /> Join Project
          </button>
        {:else if isLeader}
          <a href={`https://dash.ksi.edu.pl/projects/${project.id}`} class="btn btn-outline gap-2">
            <Shield class="size-4" /> Manage
          </a>
        {/if}
      {/if}
    </div>
  </div>

  <div class="prose max-w-none">
    <p class="text-xl text-neutral-content/80 mb-8">{project.description}</p>
    
    {#if project.tags?.length > 0}
      <div class="flex gap-2 mb-8">
        {#each project.tags as tag}
          <span class="badge badge-neutral">{tag}</span>
        {/each}
      </div>
    {/if}
    
    <div class="mt-8">
      <h2 class="text-2xl font-semibold mb-4">About the Project</h2>
      <!-- Fallback empty state for content -->
      <p class="text-neutral-content/60">Full project details and articles will be displayed here.</p>
    </div>
  </div>
</div>
