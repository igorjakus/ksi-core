<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Dropdown from '@ksi-core/ui/platform/Dropdown.svelte';
  import Skeleton from './Skeleton.svelte';
  import { Search, ArrowLeft, Trash2, Save } from '@lucide/svelte';
  import type { Profile } from 'shared/types';
  let {
    language,
    administrator,
    memberId
  }: { language: 'pl' | 'en'; administrator: boolean; memberId?: string } = $props();

  const roles = $derived([
    { value: 'member', label: 'Member' },
    { value: 'board', label: 'Board' },
    { value: 'administrator', label: 'Administrator' }
  ]);
  const statuses = $derived(
    ['pending', 'active', 'suspended', 'deleted'].map((value, i) => ({
      value,
      label: ['Pending', 'Active', 'Suspended', 'Deleted'][i]!
    }))
  );
  let records = $state<Profile[]>([]),
    total = $state(0),
    member = $state<Profile | null>(null),
    loading = $state(true),
    busy = $state(false),
    error = $state(''),
    notice = $state(''),
    confirmDelete = $state(false),
    search = $state('');
  let generation = 0;
  async function api(path: string, method = 'GET', body?: unknown) {
    const response = await fetch(`/api/users${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) {
      const messages: Record<string, string> = {
        INVALID_GITHUB_URL: 'Use a https://github.com/username profile link.',
        INVALID_LINKEDIN_URL: 'Use a https://linkedin.com/in/username profile link.',
        LAST_ADMINISTRATOR: 'The final active administrator must retain access.'
      };
      throw new Error(messages[result.code] ?? result.code ?? result.message);
    }
    return result;
  }
  async function load(id: string | undefined, query: string) {
    const current = ++generation;
    loading = true;
    error = '';
    notice = '';
    member = null;
    confirmDelete = false;
    try {
      const result = await api(id ? `/${encodeURIComponent(id)}` : `?${query}`);
      if (current !== generation) return;
      if (id) member = result;
      else {
        records = result.users;
        total = result.total;
        member = null;
      }
    } catch (e) {
      if (current === generation) error = e instanceof Error ? e.message : 'Error';
    } finally {
      if (current === generation) loading = false;
    }
  }
  $effect(() => {
    const query = page.url.searchParams.toString();
    search = page.url.searchParams.get('search') ?? '';
    void load(memberId, query);
  });
  function filter(key: string, value: string) {
    const url = new URL(page.url);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    url.searchParams.delete('page');
    void goto(url.pathname + url.search);
  }
  async function mutate(path: string, method: string, body?: unknown) {
    busy = true;
    error = '';
    notice = '';
    try {
      const result = await api(path, method, body);
      if (method === 'DELETE') await goto('/members');
      else {
        member = result.user ?? result;
        notice = 'Changes saved.';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error';
    } finally {
      busy = false;
    }
  }
</script>

{#if notice}<p role="status">{notice}</p>{/if}
{#if error}<p class="error" role="alert">{error}</p>{/if}
{#if loading}<Skeleton label={'Loading members'} />{:else if member}
  <a class="btn btn-outline" href="/members"
    ><ArrowLeft size={15} aria-hidden="true" />{'All members'}</a
  >
  <div class="member-layout">
    <section class="card">
      <h1>{member.firstName || member.name} {member.lastName}</h1>
      <p class="muted">{member.email}</p>
      {#if member.image}<img class="member-avatar" src={member.image} alt="" />{/if}
      {#if administrator && member.membershipStatus !== 'deleted'}<form
          class="profile-fields"
          onsubmit={(event) => {
            event.preventDefault();
            void mutate(`/${member!.id}/profile`, 'PATCH', {
              firstName: member!.firstName,
              lastName: member!.lastName,
              nickname: member!.nickname ?? '',
              bio: member!.bio ?? '',
              github: member!.github || null,
              linkedin: member!.linkedin || null
            });
          }}
        >
          <label
            >{'First name'}<input bind:value={member.firstName} required maxlength="100" /></label
          ><label>{'Last name'}<input bind:value={member.lastName} maxlength="100" /></label>
          <label>{'Nickname'}<input bind:value={member.nickname} maxlength="100" /></label><label
            class="wide"
            >Bio<textarea bind:value={member.bio} rows="5" maxlength="5000"></textarea></label
          >
          <label
            >GitHub<input
              type="url"
              bind:value={member.github}
              placeholder="https://github.com/username"
            /></label
          ><label
            >LinkedIn<input
              type="url"
              bind:value={member.linkedin}
              placeholder="https://linkedin.com/in/username"
            /></label
          >
          <button class="btn" disabled={busy}
            ><Save size={15} aria-hidden="true" />{'Save profile'}</button
          >
        </form>{:else}<p>{member.bio}</p>{/if}
    </section>
    <section class="card access">
      <h2>{'Access'}</h2>
      <label for="member-status">{'Account status'}</label><Dropdown
        id="member-status"
        label={'Account status'}
        value={member.membershipStatus}
        options={statuses.filter(
          (s) =>
            s.value !== 'deleted' &&
            (administrator || s.value === 'active' || s.value === 'pending')
        )}
        disabled={busy ||
          member.membershipStatus === 'deleted' ||
          (!administrator && member.membershipStatus !== 'pending')}
        onselect={(value) => mutate(`/${member!.id}/access`, 'PATCH', { membershipStatus: value })}
      />
      <label for="member-role">{'Role'}</label><Dropdown
        id="member-role"
        label={'Role'}
        value={member.role}
        options={roles}
        disabled={busy || !administrator || member.membershipStatus === 'deleted'}
        onselect={(value) => mutate(`/${member!.id}/access`, 'PATCH', { role: value })}
      />
      {#if administrator && member.membershipStatus !== 'deleted'}<form
          onsubmit={(event) => {
            event.preventDefault();
            void mutate(`/${member!.id}/access`, 'PATCH', { flags: member!.flags });
          }}
        >
          <label for="member-flags">{'Permission flags (one per line)'}</label><textarea
            id="member-flags"
            rows="4"
            value={member.flags.join('\n')}
            oninput={(event) => {
              member!.flags = event.currentTarget.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
            }}
          ></textarea><button class="btn btn-outline" disabled={busy}>{'Save permissions'}</button>
        </form>
        {#if confirmDelete}<div role="alert">
            <p>
              {'Delete account? Personal data will be anonymized. Content will remain.'}
            </p>
            <div class="row">
              <button
                class="btn danger-button"
                disabled={busy}
                onclick={() => mutate(`/${member!.id}`, 'DELETE')}>{'Confirm deletion'}</button
              ><button class="btn btn-outline" onclick={() => (confirmDelete = false)}
                >{'Cancel'}</button
              >
            </div>
          </div>{:else}<button
            class="btn btn-outline danger-button"
            onclick={() => (confirmDelete = true)}
            ><Trash2 size={15} aria-hidden="true" />{'Delete account'}</button
          >{/if}
      {/if}
    </section>
  </div>
{:else if memberId}
  <a class="btn btn-outline" href="/members">{'All members'}</a>
{:else}
  <form
    class="member-filters"
    onsubmit={(event) => {
      event.preventDefault();
      filter('search', search);
    }}
  >
    <div class="search">
      <label for="member-search" class="sr-only">{'Search members'}</label><Search
        size={16}
        aria-hidden="true"
      /><input
        id="member-search"
        bind:value={search}
        placeholder={'Name, nickname or email…'}
      /><button class="btn btn-outline">{'Search'}</button>
    </div>
    <Dropdown
      label={'Filter status'}
      value={page.url.searchParams.get('status') ?? ''}
      options={[{ value: '', label: 'All statuses' }, ...statuses]}
      onselect={(v) => filter('status', v)}
    />
    <Dropdown
      label={'Filter role'}
      value={page.url.searchParams.get('role') ?? ''}
      options={[{ value: '', label: 'All roles' }, ...roles]}
      onselect={(v) => filter('role', v)}
    />
  </form>
  <p class="muted">{'Results'}: {total}</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>{'Person'}</th><th>Email</th><th>Status</th><th>{'Role'}</th></tr></thead
      ><tbody
        >{#each records as record}<tr
            ><td
              ><a href={`/members/${encodeURIComponent(record.id)}`}
                >{record.firstName || record.name} {record.lastName}</a
              >{#if record.nickname}<small> · {record.nickname}</small>{/if}</td
            ><td>{record.email}</td><td
              >{statuses.find((s) => s.value === record.membershipStatus)?.label}</td
            ><td>{roles.find((r) => r.value === record.role)?.label}</td></tr
          >{/each}</tbody
      >
    </table>
  </div>
  {#if !records.length}<p>{'No matching members.'}</p>{/if}
  <div class="row">
    <button
      class="btn btn-outline"
      disabled={Number(page.url.searchParams.get('page') ?? 0) === 0}
      onclick={() => {
        const u = new URL(page.url);
        u.searchParams.set('page', String(Number(u.searchParams.get('page') ?? 0) - 1));
        void goto(u.pathname + u.search);
      }}>{'Previous'}</button
    ><button
      class="btn btn-outline"
      disabled={(Number(page.url.searchParams.get('page') ?? 0) + 1) * 50 >= total}
      onclick={() => {
        const u = new URL(page.url);
        u.searchParams.set('page', String(Number(u.searchParams.get('page') ?? 0) + 1));
        void goto(u.pathname + u.search);
      }}>{'Next'}</button
    >
  </div>
{/if}

<style>
  .member-layout {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
    gap: 24px;
    margin-top: 24px;
  }
  .profile-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 24px;
  }
  .profile-fields label {
    display: grid;
    gap: 8px;
  }
  .profile-fields input,
  .profile-fields textarea {
    margin: 0;
  }
  .wide {
    grid-column: 1/-1;
  }
  .access {
    display: grid;
    gap: 14px;
    align-content: start;
  }
  .member-avatar {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
  }
  .member-filters {
    display: grid;
    grid-template-columns: minmax(250px, 2fr) 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .search input {
    margin: 0;
    min-width: 0;
  }
  .search button {
    flex-shrink: 0;
  }
  a {
    color: var(--ink);
  }
  @media (max-width: 900px) {
    .member-layout,
    .member-filters {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 540px) {
    .profile-fields {
      grid-template-columns: 1fr;
    }
  }
</style>
