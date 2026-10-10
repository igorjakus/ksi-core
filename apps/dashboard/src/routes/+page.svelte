<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import Editor from '@ksi-core/ui/platform/Editor.svelte';
  import type { Profile } from 'shared/types';

  let { data } = $props();

  let language = $state<'pl' | 'en'>('pl');
  let tab = $state('projects');
  let scope = $state('');
  let error = $state('');
  let busy = $state(false);

  const text = (pl: string, en: string) => (language === 'pl' ? pl : en);

  type Project = {
    id: string;
    slug: string;
    name: string;
    description: string;
    version: number;
    locked: boolean;
    tags: string[];
    fields: string[];
  };
  type Article = {
    id: string;
    title: string;
    slug: string;
    markdown: string;
    version: number;
    state: string;
    mainArticle: boolean;
    projectFeed: boolean;
    websiteFeed: boolean;
  };
  type Item = {
    id: string;
    title: string;
    markdown: string;
    column: 'todo' | 'progress' | 'done';
    version: number;
    position: number;
    tags: string[];
  };
  type Thread = {
    id: string;
    title: string;
    visibility: string;
    version: number;
    comments?: { id: string; markdown: string }[];
  };

  let projects = $state<Project[]>([]);
  let articles = $state<Article[]>([]);
  let items = $state<Item[]>([]);
  let threads = $state<Thread[]>([]);
  let members = $state<Profile[]>([]);
  let events = $state<{ id: string; action: string; createdAt: string }[]>([]);

  let boardId = $state('');
  let title = $state('');
  let markdown = $state('');
  let slug = $state('');
  let selectedArticle = $state<Article | null>(null);
  let selectedThread = $state<Thread | null>(null);
  let visibility = $state('association');
  let leaderIds = $state('');
  let graveyard = $state(false);
  let archived = $state(false);
  let showCredit = $state(false);
  let profile = $state(untrack(() => ({ ...data.user })));

  async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.code ?? result.message ?? `${response.status}`);
    return result as T;
  }

  async function load() {
    try {
      error = '';
      projects = await api('/platform/public/projects');
      if (tab === 'articles')
        articles = await api(`/platform/articles${scope ? `?projectId=${scope}` : ''}`);
      if (tab === 'board') {
        const boards = await api<{ id: string }[]>(
          `/platform/boards${scope ? `?projectId=${scope}` : ''}`
        );
        boardId = boards[0]?.id ?? '';
        items = boardId
          ? await api(`/platform/boards/${boardId}/items?graveyard=${graveyard}`)
          : [];
      }
      if (tab === 'forum')
        threads = await api(
          `/platform/threads?archived=${archived}${scope ? `&projectId=${scope}` : ''}`
        );
      if (tab === 'users') members = await api('/users?page=0');
      if (tab === 'events')
        events = await api(`/platform/events${scope ? `?projectId=${scope}` : ''}`);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Request failed';
    }
  }

  async function action(work: () => Promise<unknown>) {
    busy = true;
    error = '';
    try {
      await work();
      await load();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Request failed';
    } finally {
      busy = false;
    }
  }

  function changeTab(next: string) {
    tab = next;
    selectedArticle = null;
    selectedThread = null;
    title = '';
    markdown = '';
    void load();
  }

  async function create() {
    if (tab === 'projects')
      return api('/platform/projects', 'POST', {
        slug,
        name: title,
        description: markdown,
        tags: [],
        fields: ['engineering'],
        leaderIds: leaderIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      });
    if (tab === 'articles') {
      const result = await api<Article>('/platform/articles', 'POST', {
        slug,
        title,
        markdown,
        ...(scope ? { projectId: scope } : {}),
        language
      });
      selectedArticle = result;
      return result;
    }
    if (tab === 'board') {
      if (!boardId) {
        const board = await api<{ id: string }>(
          '/platform/boards',
          'POST',
          scope ? { projectId: scope } : {}
        );
        boardId = board.id;
      }
      return api(`/platform/boards/${boardId}/items`, 'POST', {
        title,
        markdown,
        tags: [],
        column: 'todo',
        position: items.length
      });
    }
    if (tab === 'forum')
      return api('/platform/threads', 'POST', {
        title,
        markdown,
        visibility,
        invitedIds: [],
        ...(scope ? { projectId: scope } : {})
      });
  }

  async function saveArticle(publish: boolean) {
    if (!selectedArticle) return;
    const result = await api<Article>(`/platform/articles/${selectedArticle.id}`, 'PUT', {
      version: selectedArticle.version,
      title,
      markdown,
      state: publish ? 'published' : 'draft',
      mainArticle: selectedArticle.mainArticle,
      projectFeed: selectedArticle.projectFeed,
      websiteFeed: selectedArticle.websiteFeed
    });
    selectedArticle = result;
  }

  async function propose() {
    if (selectedArticle)
      return api(`/platform/articles/${selectedArticle.id}/proposals`, 'POST', {
        baseVersion: selectedArticle.version,
        title,
        markdown
      });
  }

  const columnDefs = [
    ['todo', text('Do zrobienia', 'To do')],
    ['progress', text('W trakcie', 'In progress')],
    ['done', text('Gotowe', 'Done')]
  ] as const;

  const tabs = $derived([
    ['projects', text('Projekty', 'Projects')],
    ['articles', text('Artykuły', 'Articles')],
    ['board', 'Kanban'],
    ['forum', 'Forum'],
    ['profile', text('Profil', 'Profile')],
    ['events', text('Aktywność', 'Activity')],
    ...(data.user.role !== 'member' ? [['users', text('Członkowie', 'Members')]] : [])
  ] as [string, string][]);

  const initials = $derived(
    `${(data.user.firstName || data.user.name)[0] ?? ''}${data.user.lastName?.[0] ?? ''}`.toUpperCase() ||
      'U'
  );

  onMount(() => {
    void load();
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    async function connect() {
      try {
        const { ticket } = await api<{ ticket: string }>('/realtime/ticket', 'POST');
        if (stopped) return;
        socket = new WebSocket(`${data.websocketOrigin}/events`, `ksi.${ticket}`);
        socket.onmessage = () => {
          void load();
        };
        socket.onclose = () => {
          if (!stopped) retry = setTimeout(() => void connect(), 5000);
        };
      } catch {
        if (!stopped) retry = setTimeout(() => void connect(), 10000);
      }
    }

    void connect();
    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  });
</script>

<svelte:head><title>Dashboard — KSI</title></svelte:head>

<!-- Pending / not active -->
{#if data.user.membershipStatus !== 'active'}
  <div class="pending-screen">
    <div class="pending-card">
      <div class="eyebrow" style="justify-content: center; margin-bottom: 20px;">
        <span class="dot"></span>DASH.KSI.EDU.PL
      </div>
      <h1>{text('Konto wymaga aktywacji', 'Account activation required')}</h1>
      <p>
        {text(
          'Twoje konto musi zostać aktywowane przez administratora. Zapytaj bezpośrednio:',
          'Your account first needs to be activated by an administrator. Ask directly:'
        )}
        {data.activationContact}.
      </p>
      <form method="POST" action="/logout">
        <button class="btn" style="margin: 0 auto;">
          {text('Wyloguj się', 'Sign out')}
        </button>
      </form>
    </div>
  </div>

  <!-- Main dashboard -->
{:else}
  <div class="dash-shell">
    <!-- Sidebar -->
    <aside class="dash-sidebar" aria-label={text('Nawigacja', 'Navigation')}>
      <span class="sidebar-logo">KSI</span>

      <span class="sidebar-section">{text('Nawigacja', 'Navigation')}</span>
      {#each tabs as [key, label] (key)}
        <button
          class="sidebar-btn {tab === key ? 'active' : ''}"
          aria-current={tab === key ? 'page' : undefined}
          onclick={() => changeTab(key)}
        >
          {label}
        </button>
      {/each}

      <button
        class="sidebar-btn"
        style="font-family: var(--mono); font-size: 11px; margin-top: 4px;"
        onclick={() => (language = language === 'pl' ? 'en' : 'pl')}
      >
        {language === 'pl' ? 'English' : 'Polski'}
      </button>

      <div class="sidebar-user">
        <span class="avatar">{initials}</span>
        <div>
          <strong>{data.user.firstName || data.user.name} {data.user.lastName}</strong>
          <small>{data.user.role}</small>
        </div>
      </div>
    </aside>

    <!-- Workspace -->
    <main class="dash-workspace">
      <!-- Welcome banner -->
      <div class="dash-welcome">
        <div>
          <div class="eyebrow">{text('Dobrze, że jesteś', 'Good to have you here')}</div>
          <p>
            {text('Cześć', 'Hi')}, {data.user.firstName || data.user.name}. {text(
              'Zbudujmy dziś coś dobrego.',
              "Let's build something good today."
            )}
          </p>
        </div>
        <span class="dash-welcome-icon" aria-hidden="true">✳</span>
      </div>

      <!-- Error banner -->
      {#if error}
        <p class="error" role="alert" style="margin-bottom: 16px;">{error}</p>
      {/if}

      <!-- Scope selector (for multi-context tabs) -->
      {#if ['articles', 'board', 'forum', 'events'].includes(tab)}
        <div class="scope-row">
          <label for="scope-select">{text('Obszar', 'Scope')}</label>
          <select id="scope-select" bind:value={scope} onchange={() => void load()}>
            <option value="">{text('Całe koło', 'Association-wide')}</option>
            {#each projects as project (project.id)}
              <option value={project.id}>{project.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- ── PROJECTS ──────────────────────────────────────────────────── -->
      {#if tab === 'projects'}
        <div class="workspace-header">
          <div>
            <div class="eyebrow" style="margin-bottom: 8px;">
              <span class="dot"></span>{text('Projekty KSI', 'KSI Projects')}
            </div>
            <h1>{text('Projekty', 'Projects')}</h1>
          </div>
          {#if data.user.role !== 'member'}
            <button
              class="btn"
              disabled={busy}
              onclick={() => {
                tab = '__create_project__';
                title = '';
                markdown = '';
                slug = '';
                leaderIds = '';
              }}
            >
              + {text('Nowy projekt', 'New project')}
            </button>
          {/if}
        </div>

        <div class="project-grid">
          {#each projects as project (project.id)}
            <article class="project-card">
              <div class="eyebrow">
                {#each project.fields as field}
                  <span class="tag" style="background: var(--mint);">{field}</span>
                {/each}
                {#if project.locked}
                  <span class="tag">{text('Zamknięty', 'Locked')}</span>
                {/if}
              </div>
              <h2>{project.name}</h2>
              <p>{project.description || text('Brak opisu.', 'No description.')}</p>
              <div class="project-card-actions">
                <button
                  disabled={busy}
                  onclick={() => action(() => api(`/platform/projects/${project.id}/join`, 'POST'))}
                >
                  {text('Dołącz', 'Join')}
                </button>
                <button
                  onclick={() => {
                    scope = project.id;
                    changeTab('board');
                  }}
                >
                  Kanban
                </button>
                <button
                  onclick={() => {
                    scope = project.id;
                    changeTab('forum');
                  }}
                >
                  Forum
                </button>
              </div>
            </article>
          {/each}
        </div>

        <!-- ── ARTICLES ──────────────────────────────────────────────────── -->
      {:else if tab === 'articles'}
        <div class="workspace-header">
          <div>
            <div class="eyebrow" style="margin-bottom: 8px;">
              <span class="dot"></span>{text('Artykuły', 'Articles')}
            </div>
            <h1>{text('Artykuły', 'Articles')}</h1>
          </div>
          <button
            class="btn"
            disabled={busy}
            onclick={() => {
              selectedArticle = null;
              title = '';
              markdown = '';
              slug = '';
            }}
          >
            + {text('Nowy artykuł', 'New article')}
          </button>
        </div>

        {#each articles as article (article.id)}
          <div
            class="list-strip"
            role="button"
            tabindex="0"
            onclick={() => {
              selectedArticle = article;
              title = article.title;
              markdown = article.markdown;
            }}
            onkeydown={(e) =>
              e.key === 'Enter' &&
              (() => {
                selectedArticle = article;
                title = article.title;
                markdown = article.markdown;
              })()}
          >
            <div class="list-strip-info">
              <h3>{article.title}</h3>
              <div class="list-strip-meta">{article.state} · {article.slug}</div>
            </div>
            <span class="tag {article.state === 'published' ? 'tag-mint' : ''}"
              >{article.state}</span
            >
          </div>
        {/each}

        {#if selectedArticle || !articles.length}
          <div class="card" style="margin-top: 20px;">
            <h2 style="font-size: 1.1rem; margin-bottom: 16px;">
              {selectedArticle
                ? text('Edytuj artykuł', 'Edit article')
                : text('Nowy artykuł', 'New article')}
            </h2>
            <label for="a-title">{text('Tytuł', 'Title')}</label>
            <input id="a-title" bind:value={title} required />
            <label for="a-slug">Slug</label>
            <input id="a-slug" bind:value={slug} />
            <Editor bind:value={markdown} />
            <div class="row" style="margin-top: 16px; gap: 8px;">
              {#if selectedArticle}
                <button
                  class="btn"
                  disabled={busy}
                  onclick={() => action(() => saveArticle(false))}
                >
                  {text('Zapisz szkic', 'Save draft')}
                </button>
                <button
                  class="btn-coral btn"
                  disabled={busy}
                  onclick={() => action(() => saveArticle(true))}
                >
                  {text('Opublikuj', 'Publish')}
                </button>
                <button disabled={busy} onclick={() => action(propose)}>
                  {text('Zaproponuj zmianę', 'Propose edit')}
                </button>
                <label
                  style="display: flex; align-items: center; gap: 6px; font-size: 12px; text-transform: none; letter-spacing: 0; color: var(--muted); cursor: pointer;"
                >
                  <input
                    type="checkbox"
                    bind:checked={showCredit}
                    onchange={() =>
                      action(() =>
                        api(`/platform/articles/${selectedArticle!.id}/credit`, 'PUT', {
                          publicCredit: showCredit
                        })
                      )}
                  />
                  {text('Pokaż mnie jako autora', 'Show my author credit')}
                </label>
              {:else}
                <button class="btn" disabled={busy || !title.trim()} onclick={() => action(create)}>
                  {text('Utwórz', 'Create')}
                </button>
              {/if}
            </div>
          </div>
        {/if}

        <!-- ── BOARD ─────────────────────────────────────────────────────── -->
      {:else if tab === 'board'}
        <div class="workspace-header">
          <div>
            <div class="eyebrow" style="margin-bottom: 8px;">
              <span class="dot"></span>Kanban
            </div>
            <h1>{text('Tablica zadań', 'Task board')}</h1>
          </div>
          <div class="row" style="gap: 8px;">
            <label
              style="display: flex; align-items: center; gap: 6px; font-size: 12px; text-transform: none; letter-spacing: 0; cursor: pointer; margin: 0; color: var(--muted);"
            >
              <input type="checkbox" bind:checked={graveyard} onchange={() => void load()} />
              {text('Cmentarzysko', 'Graveyard')}
            </label>
            <button
              class="btn"
              disabled={busy}
              onclick={() => {
                title = '';
                markdown = '';
              }}
            >
              + {text('Nowe zadanie', 'New task')}
            </button>
          </div>
        </div>

        <div class="board">
          {#each columnDefs as [column, label] (column)}
            <section class="board-column">
              <div class="column-header">
                <span>{label}</span>
                <span>{items.filter((i) => i.column === column).length}</span>
              </div>
              {#each items.filter((i) => i.column === column) as item (item.id)}
                <article class="kanban-card">
                  <strong>{item.title}</strong>
                  {#if item.markdown}
                    <p>{item.markdown.slice(0, 120)}{item.markdown.length > 120 ? '…' : ''}</p>
                  {/if}
                  <div class="kanban-card-actions">
                    {#if graveyard}
                      <button
                        disabled={busy}
                        onclick={() =>
                          action(() =>
                            api(`/platform/items/${item.id}/restore`, 'POST', {
                              version: item.version
                            })
                          )}
                      >
                        {text('Przywróć', 'Restore')}
                      </button>
                    {:else}
                      <select
                        aria-label={text('Przenieś', 'Move')}
                        value={item.column}
                        onchange={(e) =>
                          action(() =>
                            api(`/platform/items/${item.id}`, 'PATCH', {
                              version: item.version,
                              column: e.currentTarget.value
                            })
                          )}
                      >
                        <option value="todo">To do</option>
                        <option value="progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                      <button
                        disabled={busy}
                        onclick={() =>
                          action(() =>
                            api(`/platform/items/${item.id}`, 'DELETE', { version: item.version })
                          )}
                        style="color: #8b2520;"
                      >
                        {text('Usuń', 'Delete')}
                      </button>
                    {/if}
                  </div>
                </article>
              {/each}
            </section>
          {/each}
        </div>

        <!-- New task form -->
        {#if !graveyard}
          <div class="card" style="margin-top: 20px;">
            <h2 style="font-size: 1rem; margin-bottom: 14px;">
              {text('Nowe zadanie', 'New task')}
            </h2>
            <label for="task-title">{text('Tytuł', 'Title')}</label>
            <input id="task-title" bind:value={title} required />
            <Editor bind:value={markdown} />
            <button
              class="btn"
              disabled={busy || !title.trim()}
              onclick={() => action(create)}
              style="margin-top: 12px;"
            >
              {text('Utwórz', 'Create')}
            </button>
          </div>
        {/if}

        <!-- ── FORUM ─────────────────────────────────────────────────────── -->
      {:else if tab === 'forum'}
        <div class="workspace-header">
          <div>
            <div class="eyebrow" style="margin-bottom: 8px;">
              <span class="dot"></span>Forum
            </div>
            <h1>Forum</h1>
          </div>
          <label
            style="display: flex; align-items: center; gap: 6px; font-size: 12px; text-transform: none; letter-spacing: 0; color: var(--muted); cursor: pointer;"
          >
            <input type="checkbox" bind:checked={archived} onchange={() => void load()} />
            {text('Archiwum', 'Archive')}
          </label>
        </div>

        {#each threads as thread (thread.id)}
          <div
            class="list-strip"
            role="button"
            tabindex="0"
            onclick={() =>
              action(async () => {
                selectedThread = await api(`/platform/threads/${thread.id}`);
              })}
            onkeydown={(e) =>
              e.key === 'Enter' &&
              action(async () => {
                selectedThread = await api(`/platform/threads/${thread.id}`);
              })}
          >
            <div class="list-strip-info">
              <h3>{thread.title}</h3>
              <div class="list-strip-meta">{thread.visibility}</div>
            </div>
            <span class="tag">{thread.visibility}</span>
          </div>
        {/each}

        {#if selectedThread}
          <div class="card" style="margin-top: 16px;">
            <h2 style="font-size: 1.1rem; margin-bottom: 12px;">{selectedThread.title}</h2>
            {#each selectedThread.comments ?? [] as comment (comment.id)}
              <div
                style="border-top: 1px solid var(--line); padding: 12px 0; font-size: 13px; white-space: pre-wrap;"
              >
                {comment.markdown}
              </div>
            {/each}
            <div style="margin-top: 16px; display: grid; gap: 8px;">
              <label for="reply-md">{text('Odpowiedź', 'Reply')}</label>
              <Editor bind:value={markdown} />
              <div class="row" style="gap: 8px;">
                <button
                  class="btn"
                  disabled={busy}
                  onclick={() =>
                    action(() =>
                      api(`/platform/threads/${selectedThread!.id}/comments`, 'POST', { markdown })
                    )}
                >
                  {text('Dodaj odpowiedź', 'Reply')}
                </button>
                <button
                  disabled={busy}
                  onclick={() =>
                    action(() =>
                      api(`/platform/threads/${selectedThread!.id}/archive`, 'POST', {
                        version: selectedThread!.version,
                        archived: !archived
                      })
                    )}
                >
                  {text('Archiwizuj / przywróć', 'Archive / restore')}
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- New thread form -->
        <div class="card" style="margin-top: 20px;">
          <h2 style="font-size: 1rem; margin-bottom: 14px;">{text('Nowy wątek', 'New thread')}</h2>
          <label for="thread-title">{text('Temat', 'Subject')}</label>
          <input id="thread-title" bind:value={title} required />
          <label for="thread-vis">{text('Widoczność', 'Visibility')}</label>
          <select id="thread-vis" bind:value={visibility}>
            <option value="association">{text('Członkowie koła', 'Association members')}</option>
            <option value="members">{text('Członkowie projektu', 'Project members')}</option>
            <option value="leaders">{text('Liderzy', 'Leaders')}</option>
          </select>
          <Editor bind:value={markdown} />
          <button
            class="btn"
            disabled={busy || !title.trim()}
            onclick={() => action(create)}
            style="margin-top: 12px;"
          >
            {text('Utwórz wątek', 'Create thread')}
          </button>
        </div>

        <!-- ── PROFILE ────────────────────────────────────────────────────── -->
      {:else if tab === 'profile'}
        <div class="workspace-header">
          <div>
            <div class="eyebrow" style="margin-bottom: 8px;">
              <span class="dot"></span>{text('Twój profil', 'Your profile')}
            </div>
            <h1>{text('Profil', 'Profile')}</h1>
          </div>
        </div>

        <div class="card profile-form" style="max-width: 560px;">
          <form
            onsubmit={(e) => {
              e.preventDefault();
              void action(() =>
                api('/users/me', 'PATCH', {
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  nickname: profile.nickname ?? '',
                  bio: profile.bio ?? '',
                  ...(profile.github ? { github: profile.github } : {}),
                  ...(profile.linkedin ? { linkedin: profile.linkedin } : {}),
                  publicPrivacy: profile.publicPrivacy
                })
              );
            }}
            style="display: grid; gap: 4px;"
          >
            <label for="p-first">{text('Imię', 'First name')}</label>
            <input id="p-first" bind:value={profile.firstName} required />

            <label for="p-last">{text('Nazwisko', 'Last name')}</label>
            <input id="p-last" bind:value={profile.lastName} />

            <label for="p-nick">{text('Pseudonim', 'Nickname')}</label>
            <input id="p-nick" bind:value={profile.nickname} />

            <label for="p-bio">Bio</label>
            <textarea id="p-bio" bind:value={profile.bio}></textarea>

            <label for="p-gh">GitHub</label>
            <input id="p-gh" type="url" bind:value={profile.github} />

            <label for="p-li">LinkedIn</label>
            <input id="p-li" type="url" bind:value={profile.linkedin} />

            <label for="p-priv">{text('Widoczność publiczna', 'Public privacy')}</label>
            <select id="p-priv" bind:value={profile.publicPrivacy}>
              <option value="full-name">{text('Pełne imię i nazwisko', 'Full name')}</option>
              <option value="last-initial">{text('Imię i inicjał', 'First name + initial')}</option>
              <option value="initials">{text('Inicjały', 'Initials')}</option>
            </select>

            <button class="btn" disabled={busy} style="margin-top: 8px;">
              {text('Zapisz', 'Save')}
            </button>
          </form>

          <details style="margin-top: 24px; border-top: 1px solid var(--line); padding-top: 20px;">
            <summary style="cursor: pointer; font-size: 13px; color: var(--muted);">
              {text('Usuń konto', 'Delete account')}
            </summary>
            <p class="notice" style="margin-top: 12px;">
              {text(
                'Profil zostanie zanonimizowany. Treści pozostają własnością koła.',
                'Your profile will be anonymized. Association content remains.'
              )}
            </p>
            <button
              style="margin-top: 12px; color: #8b2520; border-color: #f0c4c0 !important;"
              onclick={() =>
                action(async () => {
                  await api('/users/me', 'DELETE');
                  location.reload();
                })}
            >
              {text('Potwierdzam usunięcie konta', 'Confirm account deletion')}
            </button>
          </details>
        </div>

        <!-- ── USERS (admin/board) ────────────────────────────────────────── -->
      {:else if tab === 'users'}
        <div class="workspace-header">
          <div>
            <div class="eyebrow" style="margin-bottom: 8px;">
              <span class="dot"></span>{text('Administracja', 'Administration')}
            </div>
            <h1>{text('Członkowie', 'Members')}</h1>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{text('Osoba', 'Person')}</th>
                <th>Status</th>
                <th>{text('Rola', 'Role')}</th>
                <th>{text('Działania', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {#each members as member (member.id)}
                <tr>
                  <td>
                    <strong>{member.firstName || member.name} {member.lastName}</strong>
                    <br />
                    <small style="font-family: var(--mono); font-size: 10px; color: var(--muted);"
                      >{member.id}</small
                    >
                  </td>
                  <td>
                    <span
                      class="tag {member.membershipStatus === 'active'
                        ? 'tag-mint'
                        : member.membershipStatus === 'suspended'
                          ? 'tag-coral'
                          : ''}">{member.membershipStatus}</span
                    >
                  </td>
                  <td>
                    <span class="tag {member.role === 'administrator' ? 'tag-lavender' : ''}"
                      >{member.role}</span
                    >
                  </td>
                  <td>
                    <button
                      disabled={busy}
                      onclick={() =>
                        action(() =>
                          api(`/users/${member.id}/access`, 'PATCH', { membershipStatus: 'active' })
                        )}
                    >
                      {text('Aktywuj', 'Activate')}
                    </button>
                    {#if data.user.role === 'administrator'}
                      <select
                        aria-label={`Role of ${member.name}`}
                        value={member.role}
                        onchange={(e) =>
                          action(() =>
                            api(`/users/${member.id}/access`, 'PATCH', {
                              role: e.currentTarget.value
                            })
                          )}
                      >
                        <option value="member">Member</option>
                        <option value="board">Board</option>
                        <option value="administrator">Administrator</option>
                      </select>
                      <button
                        disabled={busy}
                        style="color: #8b2520;"
                        onclick={() =>
                          action(() =>
                            api(`/users/${member.id}/access`, 'PATCH', {
                              membershipStatus: 'suspended'
                            })
                          )}
                      >
                        {text('Zawieś', 'Suspend')}
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- ── EVENTS ─────────────────────────────────────────────────────── -->
      {:else if tab === 'events'}
        <div class="workspace-header">
          <div>
            <div class="eyebrow" style="margin-bottom: 8px;">
              <span class="dot"></span>{text('Historia', 'History')}
            </div>
            <h1>{text('Aktywność', 'Activity')}</h1>
          </div>
        </div>
        {#each events as event (event.id)}
          <div class="event-item">
            <time datetime={event.createdAt}
              >{new Date(event.createdAt).toLocaleString(
                language === 'pl' ? 'pl-PL' : 'en-GB'
              )}</time
            >
            <span>{event.action}</span>
          </div>
        {/each}
        {#if !events.length}
          <p class="muted" style="margin-top: 20px;">
            {text('Brak aktywności.', 'No activity yet.')}
          </p>
        {/if}

        <!-- ── CREATE PROJECT (board/admin only) ──────────────────────────── -->
      {:else if tab === '__create_project__'}
        <div class="workspace-header">
          <div>
            <h1>{text('Nowy projekt', 'New project')}</h1>
          </div>
          <button onclick={() => changeTab('projects')} style="font-size: 13px;">
            ← {text('Wróć', 'Back')}
          </button>
        </div>
        <div class="card" style="max-width: 600px;">
          <label for="cp-title">{text('Nazwa', 'Name')}</label>
          <input id="cp-title" bind:value={title} required />
          <label for="cp-slug">Slug</label>
          <input id="cp-slug" bind:value={slug} />
          <label for="cp-leaders"
            >{text('ID liderów (po przecinku)', 'Leader IDs (comma-separated)')}</label
          >
          <input id="cp-leaders" bind:value={leaderIds} placeholder={data.user.id} />
          <label for="cp-desc">{text('Opis', 'Description')}</label>
          <Editor bind:value={markdown} />
          <button
            class="btn"
            disabled={busy || !title.trim()}
            onclick={() => action(create)}
            style="margin-top: 12px;"
          >
            {text('Utwórz projekt', 'Create project')}
          </button>
        </div>
      {/if}

      <!-- Logout -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--line);">
        <form method="POST" action="/logout">
          <button style="font-size: 12px; color: var(--muted);">
            {text('Wyloguj się', 'Sign out')} →
          </button>
        </form>
      </div>
    </main>
  </div>
{/if}
