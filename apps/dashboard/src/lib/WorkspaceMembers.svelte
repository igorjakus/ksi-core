<script lang="ts">
  import { Github, Linkedin, ArrowLeft, Search } from '@lucide/svelte';
  import Skeleton from './Skeleton.svelte';
  import MemberPreview from './MemberPreview.svelte';
  let {
    projectId,
    memberId,
    elevated = false
  }: { projectId?: string; memberId?: string; elevated?: boolean } = $props();
  type Member = {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string | null;
    image: string | null;
    bio: string | null;
    role: string;
    leader?: boolean;
    github?: string | null;
    linkedin?: string | null;
  };
  let members = $state<Member[]>([]),
    person = $state<Member | null>(null),
    loading = $state(true),
    error = $state(''),
    search = $state('');
  let generation = 0;
  const filtered = $derived(
    members.filter((m) =>
      `${m.firstName} ${m.lastName} ${m.nickname ?? ''}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase())
    )
  );
  function role(m: Member) {
    return m.leader
      ? 'Project leader'
      : m.role === 'administrator'
        ? 'Administrator'
        : m.role === 'board'
          ? 'Board member'
          : 'Member';
  }
  $effect(() => {
    const path = memberId
      ? `/members/${encodeURIComponent(memberId)}`
      : projectId
        ? `/projects/${encodeURIComponent(projectId)}/members`
        : '/members';
    const current = ++generation;
    loading = true;
    error = '';
    void fetch(`/api/platform${path}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load members.');
        const result = await response.json();
        if (current !== generation) return;
        if (memberId) person = result;
        else members = result;
      })
      .catch((e) => {
        if (current === generation) error = e.message;
      })
      .finally(() => {
        if (current === generation) loading = false;
      });
  });
</script>

{#if loading}<Skeleton label="Loading members" />{:else if error}<p class="error" role="alert">
    {error}
  </p>{:else if person}
  <a class="btn btn-outline" href="/association/members"><ArrowLeft size={15} />{'Members'}</a>
  <section class="card person">
    {#if person.image}<img class="portrait" src={person.image} alt="" />{/if}
    <div>
      <h1>{person.firstName} {person.lastName}</h1>
      {#if person.nickname}<p>aka. {person.nickname}</p>{/if}
      <p class="muted">{role(person)}</p>
      <p class="bio">{person.bio}</p>
      <div class="row">
        {#if person.github}<a
            class="btn btn-outline"
            href={person.github}
            rel="noopener noreferrer"
            target="_blank"><Github size={16} />GitHub</a
          >{/if}{#if person.linkedin}<a
            class="btn btn-outline"
            href={person.linkedin}
            rel="noopener noreferrer"
            target="_blank"><Linkedin size={16} />LinkedIn</a
          >{/if}
        {#if elevated}<a class="btn btn-outline" href={`/members/${encodeURIComponent(person.id)}`}
            >{'Manage account'}</a
          >{/if}
      </div>
    </div>
  </section>
{:else}
  <div class="workspace-header">
    <h1>{'Members'}</h1>
    <label class="search"
      ><Search size={16} /><input
        aria-label="Search members"
        placeholder="Name or nickname…"
        bind:value={search}
      /></label
    >
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>{'Person'}</th><th>{'Role'}</th><th class="bio-cell">{'About'}</th></tr></thead
      ><tbody>
        {#each filtered as member}<tr
            ><td
              ><MemberPreview
                {member}
                href={`/people/${encodeURIComponent(member.id)}`}
                role={role(member)}
              /></td
            ><td>{role(member)}</td><td class="bio-cell">{member.bio}</td></tr
          >{/each}
      </tbody>
    </table>
  </div>
  {#if !filtered.length}<p class="muted">{'No matching members.'}</p>{/if}
{/if}

<style>
  .search {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 320px;
  }
  .search input {
    margin: 0;
  }
  .bio-cell {
    max-width: 360px;
    overflow-wrap: anywhere;
  }
  .bio {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .person {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 24px;
    margin-top: 24px;
  }
  .portrait {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }
  @media (max-width: 600px) {
    .workspace-header {
      display: grid;
      gap: 16px;
    }
    .bio-cell {
      display: none;
    }
    .person {
      grid-template-columns: 1fr;
    }
  }
</style>
