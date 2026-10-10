<script lang="ts">
  import { onMount, untrack, tick } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { parseDashboardPath, dashboardPath, type Workspace } from '$lib/navigation';
  import {
    preferences,
    setLanguage,
    setTheme,
    type ThemePreference
  } from '$lib/preferences.svelte';
  import Skeleton from '$lib/Skeleton.svelte';
  import { fly } from 'svelte/transition';
  import Editor from '@ksi-core/ui/platform/Editor.svelte';
  import Dropdown from '@ksi-core/ui/platform/Dropdown.svelte';
  import {
    Plus,
    X,
    Menu,
    ArrowLeft,
    ArrowUpRight,
    ChevronDown,
    Folder,
    Columns3,
    MessagesSquare,
    FileText,
    Activity,
    LayoutDashboard,
    Users,
    UserRound,
    LogOut,
    SunMoon,
    Trash2,
    RotateCcw,
    Save,
    Shield,
    Github,
    Linkedin,
    Check,
    Archive
  } from '@lucide/svelte';
  import type { Profile } from 'shared/types';

  let { data } = $props();

  let language = $derived(preferences.language);
  let workspace = $state<Workspace>(untrack(() => data.navigation.workspace));
  let mobileNavigation = $state(false);
  let preferencesMenu = $state<HTMLDetailsElement>();
  let accountMenu = $state<HTMLDetailsElement>();
  let loading = $state(true);
  let newArticle = $state(false);
  let composer = $state(false);
  let loadGeneration = 0;
  let mounted = $state(false);
  let projectSlug = $state(untrack(() => data.navigation.projectSlug));
  let tab = $state(untrack(() => data.navigation.tab));
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
    deletedAt?: string;
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
  let graveyard = $state(untrack(() => data.navigation.graveyard ?? false));
  let taskColumn = $state<Item['column']>('todo');
  let profileSaved = $state(false);
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

  async function load(foreground = false) {
    const generation = ++loadGeneration;
    const currentTab = tab;
    let currentScope = scope;
    if (foreground) loading = true;
    try {
      error = '';
      const projectList = await api<Project[]>('/platform/public/projects');
      if (generation !== loadGeneration) return;
      projects = projectList;
      if (workspace === 'project') {
        const project = projectList.find((project) => project.slug === projectSlug);
        if (!project) {
          error = text('Nie znaleziono projektu.', 'Project not found.');
          return;
        }
        scope = currentScope = project.id;
      }
      const query = currentScope ? `?projectId=${encodeURIComponent(currentScope)}` : '';
      if (currentTab === 'articles') {
        const result = await api<Article[]>(`/platform/articles${query}`);
        if (generation === loadGeneration) articles = result;
      }
      if (currentTab === 'board') {
        let board: { id: string } | null = null;
        try {
          board = await api<{ id: string }>(`/platform/boards${query}`);
        } catch (cause) {
          if (!(cause instanceof Error && cause.message === 'BOARD_NOT_FOUND')) throw cause;
        }
        if (generation !== loadGeneration) return;
        const id = board?.id ?? '';
        const result = id
          ? await api<Item[]>(`/platform/boards/${id}/items?graveyard=${graveyard}`)
          : [];
        if (generation === loadGeneration) {
          boardId = id;
          items = result;
        }
      }
      if (currentTab === 'forum') {
        const result = await api<Thread[]>(
          `/platform/threads?archived=${archived}${currentScope ? `&projectId=${encodeURIComponent(currentScope)}` : ''}`
        );
        if (generation === loadGeneration) threads = result;
      }
      if (currentTab === 'users') {
        const result = await api<Profile[]>('/users?page=0');
        if (generation === loadGeneration) members = result;
      }
      if (currentTab === 'events') {
        const result = await api<typeof events>(`/platform/events${query}`);
        if (generation === loadGeneration) events = result;
      }
    } catch (cause) {
      if (generation === loadGeneration)
        error = cause instanceof Error ? cause.message : 'Request failed';
    } finally {
      if (generation === loadGeneration) loading = false;
    }
  }

  async function action(work: () => Promise<unknown>) {
    if (workspace === 'project' && !scope) return;
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

  function resetView() {
    selectedArticle = null;
    selectedThread = null;
    newArticle = false;
    composer = false;
    articles = [];
    items = [];
    threads = [];
    events = [];
    members = [];
    boardId = '';
    title = '';
    markdown = '';
    slug = '';
    leaderIds = '';
    graveyard = false;
    archived = false;
    showCredit = false;
    visibility = workspace === 'project' ? 'members' : 'association';
    mobileNavigation = false;
    if (accountMenu) accountMenu.open = false;
    if (preferencesMenu) preferencesMenu.open = false;
  }

  function guardNavigation(event: MouseEvent) {
    if (busy) event.preventDefault();
    else mobileNavigation = false;
  }

  function changeTab(next: string) {
    if (busy) return;
    const path = dashboardPath(workspace, projectSlug, next);
    void goto(path);
  }

  function restoreLocation(pathname: string) {
    const location = parseDashboardPath(pathname);
    if (!location) return;
    workspace = location.workspace;
    projectSlug = location.projectSlug;
    tab = location.tab;
    scope = '';

    resetView();
    graveyard = location.graveyard ?? false;
    void load(true);
  }

  $effect(() => {
    const pathname = page.url.pathname;
    if (mounted) untrack(() => restoreLocation(pathname));
  });

  async function openNavigation() {
    mobileNavigation = !mobileNavigation;
    if (mobileNavigation) {
      await tick();
      document.querySelector<HTMLButtonElement>('.mobile-close')?.focus();
    }
  }

  function closeMenus(event: KeyboardEvent) {
    if (
      event.key === 'Tab' &&
      mobileNavigation &&
      window.matchMedia('(max-width: 760px)').matches
    ) {
      const controls = [
        ...document.querySelectorAll<HTMLElement>(
          '#dashboard-navigation button:not(:disabled), #dashboard-navigation a[href]'
        )
      ];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    if (event.key !== 'Escape') return;
    if (mobileNavigation) {
      mobileNavigation = false;
      document.getElementById('navigation-toggle')?.focus();
    }
    for (const menu of [preferencesMenu, accountMenu]) {
      if (menu?.open) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    }
  }

  function closeOutsideMenus(event: PointerEvent) {
    if (!(event.target instanceof Node)) return;
    for (const menu of [preferencesMenu, accountMenu]) {
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    }
  }

  async function openTaskComposer(column: Item['column']) {
    title = '';
    markdown = '';
    taskColumn = column;
    composer = true;
    await tick();
    document.getElementById('task-title')?.focus();
  }

  async function saveProfile() {
    profileSaved = false;
    await action(async () => {
      const result = await api<{ user: Profile }>('/users/me', 'PATCH', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        nickname: profile.nickname ?? '',
        bio: profile.bio ?? '',
        github: profile.github || null,
        linkedin: profile.linkedin || null,
        publicPrivacy: profile.publicPrivacy
      });
      profile = result.user;
      profileSaved = true;
      await invalidateAll();
    });
  }

  async function create() {
    if (tab === '__create_project__')
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
      const result = await api(`/platform/boards/${boardId}/items`, 'POST', {
        title,
        markdown,
        tags: [],
        column: taskColumn,
        position: items.filter((item) => item.column === taskColumn).length
      });
      composer = false;
      title = '';
      markdown = '';
      return result;
    }
    if (tab === 'forum') {
      const result = await api('/platform/threads', 'POST', {
        title,
        markdown,
        visibility,
        invitedIds: [],
        ...(scope ? { projectId: scope } : {})
      });
      composer = false;
      title = '';
      markdown = '';
      return result;
    }
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

  const columnDefs = $derived([
    ['todo', text('Do zrobienia', 'To do')],
    ['progress', text('W trakcie', 'In progress')],
    ['done', text('Gotowe', 'Done')]
  ] as const);

  const tabs = $derived([
    ['overview', text('Przegląd', 'Overview')],
    ['board', 'Kanban'],
    ['forum', 'Forum'],
    ['articles', text('Artykuły', 'Articles')],
    ['events', text('Aktywność', 'Activity')]
  ] as [string, string][]);
  const selectedProject = $derived(projects.find((project) => project.id === scope));
  const workspaceName = $derived(
    workspace === 'project'
      ? (selectedProject?.name ?? text('Projekt', 'Project'))
      : text('Całe koło', 'Association')
  );
  const viewName = $derived(
    graveyard && tab === 'board'
      ? text('Usunięte zadania', 'Removed tasks')
      : tab === 'projects'
        ? text('Projekty', 'Projects')
        : tab === 'profile'
          ? text('Mój profil', 'My profile')
          : tab === 'users'
            ? text('Członkowie', 'Members')
            : tab === '__create_project__'
              ? text('Nowy projekt', 'New project')
              : (tabs.find(([key]) => key === tab)?.[1] ?? '')
  );

  const navigationIcons: Record<string, typeof LayoutDashboard> = {
    overview: LayoutDashboard,
    board: Columns3,
    forum: MessagesSquare,
    articles: FileText,
    events: Activity
  };
  const pickerOptions = $derived([
    { value: 'directory', label: text('Wszystkie projekty', 'All projects'), href: '/projects' },
    { value: 'association', label: text('Całe koło', 'Association'), href: '/association' },
    ...projects.map((project) => ({
      value: project.id,
      label: project.name,
      href: dashboardPath(
        'project',
        project.slug,
        ['board', 'forum', 'articles', 'events'].includes(tab) ? tab : 'overview'
      )
    }))
  ]);
  const columnOptions = $derived(columnDefs.map(([value, label]) => ({ value, label })));
  const privacyOptions = $derived([
    { value: 'full-name', label: text('Pełne imię i nazwisko', 'Full name') },
    { value: 'last-initial', label: text('Imię i inicjał nazwiska', 'First name + last initial') },
    { value: 'initials', label: text('Tylko inicjały', 'Initials only') }
  ]);
  const publicName = $derived(
    profile.publicPrivacy === 'initials'
      ? `${profile.firstName?.[0] ?? ''}.${profile.lastName?.[0] ? ` ${profile.lastName[0]}.` : ''}`
      : profile.publicPrivacy === 'last-initial'
        ? `${profile.firstName} ${profile.lastName?.[0] ? `${profile.lastName[0]}.` : ''}`
        : `${profile.firstName} ${profile.lastName}`
  );

  const initials = $derived(
    `${(data.user.firstName || data.user.name)[0] ?? ''}${data.user.lastName?.[0] ?? ''}`.toUpperCase() ||
      'U'
  );

  onMount(() => {
    if (data.user.membershipStatus !== 'active') return;
    mounted = true;
    const viewport = window.matchMedia('(max-width: 760px)');
    const syncViewport = () => {
      if (!viewport.matches) mobileNavigation = false;
    };
    viewport.addEventListener('change', syncViewport);
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
      mounted = false;
      viewport.removeEventListener('change', syncViewport);
      stopped = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  });
</script>

<svelte:head><title>{viewName} — KSI</title></svelte:head>
<svelte:window onkeydown={closeMenus} onpointerdown={closeOutsideMenus} />

<!-- Pending / not active -->
{#if data.user.membershipStatus !== 'active'}
  <div class="pending-screen">
    <div class="pending-card">
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
    {#if mobileNavigation}
      <button
        class="navigation-backdrop"
        tabindex="-1"
        aria-hidden="true"
        aria-label={text('Zamknij nawigację', 'Close navigation')}
        onclick={() => {
          mobileNavigation = false;
          document.getElementById('navigation-toggle')?.focus();
        }}
      ></button>
    {/if}
    <aside
      id="dashboard-navigation"
      class="dash-sidebar"
      class:mobile-open={mobileNavigation}
      role={mobileNavigation ? 'dialog' : undefined}
      aria-modal={mobileNavigation ? true : undefined}
      aria-label={text('Nawigacja', 'Navigation')}
    >
      <div class="sidebar-brand">
        <span class="sidebar-logo">KSI<span> / core</span></span>
        <button
          class="mobile-close"
          onclick={() => {
            mobileNavigation = false;
            document.getElementById('navigation-toggle')?.focus();
          }}
          aria-label={text('Zamknij nawigację', 'Close navigation')}
          ><X size={20} aria-hidden="true" /></button
        >
      </div>
      <div class="sidebar-context">
        <Dropdown
          label={text('Wybierz przestrzeń', 'Choose workspace')}
          value={workspace === 'project'
            ? scope
            : workspace === 'association'
              ? 'association'
              : 'directory'}
          options={pickerOptions}
          placeholder={workspaceName}
          searchable
          variant="workspace"
          disabled={busy}
          searchPlaceholder={text('Szukaj projektu…', 'Search projects…')}
          emptyLabel={text('Nie znaleziono projektu.', 'No projects found.')}
        >
          {#snippet leading()}<Folder size={18} strokeWidth={1.7} aria-hidden="true" />{/snippet}
        </Dropdown>
      </div>
      {#if workspace !== 'directory'}
        <nav aria-label={workspaceName}>
          {#each tabs as [key, label] (key)}
            {@const Icon = navigationIcons[key]}
            <a
              class="sidebar-btn"
              class:active={tab === key}
              aria-disabled={busy}
              aria-current={tab === key ? 'page' : undefined}
              href={dashboardPath(workspace, projectSlug, key)}
              onclick={guardNavigation}
            >
              <span class="navigation-label"
                ><Icon size={16} strokeWidth={1.7} aria-hidden="true" />{label}</span
              >
            </a>
          {/each}
        </nav>
      {:else}
        <a
          class="sidebar-btn"
          class:active={tab === 'projects' || tab === '__create_project__'}
          aria-disabled={busy}
          href="/projects"
          onclick={guardNavigation}
          aria-current={tab === 'projects' ? 'page' : undefined}
          ><span class="navigation-label"
            ><Folder size={16} aria-hidden="true" />{text('Projekty', 'Projects')}</span
          ></a
        >
        <a class="sidebar-btn" aria-disabled={busy} href="/association" onclick={guardNavigation}>
          <span class="navigation-label"
            ><Users size={16} aria-hidden="true" />{text('Całe koło', 'Association')}</span
          ><ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <p class="sidebar-hint">
          {text(
            'Wybierz projekt, aby otworzyć jego tablicę, forum i artykuły.',
            'Choose a project to open its board, forum, and articles.'
          )}
        </p>
      {/if}
      <div class="sidebar-global">
        {#if workspace === 'project'}
          <a class="sidebar-btn" aria-disabled={busy} href="/association" onclick={guardNavigation}
            ><span class="navigation-label"
              ><Users size={16} aria-hidden="true" />{text('Całe koło', 'Association')}</span
            ><ArrowUpRight size={14} aria-hidden="true" /></a
          >
        {/if}
        {#if data.user.role !== 'member'}
          <span class="sidebar-section">{text('Administracja koła', 'Association management')}</span
          >
          <a
            class="sidebar-btn"
            class:active={tab === 'users'}
            aria-disabled={busy}
            aria-current={tab === 'users' ? 'page' : undefined}
            href="/members"
            onclick={guardNavigation}>{text('Członkowie', 'Members')}</a
          >
        {/if}
        <span class="sidebar-footnote"
          >KSI · {text('Uniwersytet Wrocławski', 'University of Wrocław')}</span
        >
      </div>
    </aside>

    <div class="dash-body" inert={mobileNavigation}>
      <header class="dash-topbar">
        <button
          id="navigation-toggle"
          class="navigation-toggle"
          aria-controls="dashboard-navigation"
          aria-expanded={mobileNavigation}
          disabled={busy}
          onclick={openNavigation}
        >
          <Menu size={20} strokeWidth={1.7} aria-hidden="true" /><span class="sr-only"
            >{text('Nawigacja', 'Navigation')}</span
          >
        </button>
        <div
          class="workspace-breadcrumb"
          aria-label={text('Bieżąca przestrzeń', 'Current workspace')}
        >
          <a
            href={workspace === 'directory'
              ? '/projects'
              : dashboardPath(workspace, projectSlug, 'overview')}
            onclick={guardNavigation}>{workspace === 'directory' ? 'KSI' : workspaceName}</a
          ><span aria-hidden="true">/</span><strong>{viewName}</strong>
        </div>
        <div class="topbar-controls">
          <details
            class="topbar-menu"
            bind:this={preferencesMenu}
            ontoggle={() => {
              if (preferencesMenu?.open && accountMenu) accountMenu.open = false;
            }}
          >
            <summary aria-label={text('Język i wygląd', 'Language and appearance')}
              ><SunMoon size={18} aria-hidden="true" /><span class="preferences-label"
                >{text('Preferencje', 'Preferences')}</span
              ></summary
            >
            <div class="menu-panel preferences-panel">
              <label for="dashboard-language">{text('Język', 'Language')}</label>
              <Dropdown
                id="dashboard-language"
                label={text('Język', 'Language')}
                value={language}
                options={[
                  { value: 'pl', label: 'Polski' },
                  { value: 'en', label: 'English' }
                ]}
                onselect={(value) => setLanguage(value as 'pl' | 'en')}
              />
              <label for="dashboard-theme">{text('Wygląd', 'Appearance')}</label>
              <Dropdown
                id="dashboard-theme"
                label={text('Wygląd', 'Appearance')}
                value={preferences.theme}
                options={[
                  { value: 'system', label: text('Systemowy', 'System') },
                  { value: 'light', label: text('Jasny', 'Light') },
                  { value: 'dark', label: text('Ciemny', 'Dark') }
                ]}
                onselect={(value) => setTheme(value as ThemePreference)}
              />
            </div>
          </details>
          <details
            class="topbar-menu"
            bind:this={accountMenu}
            ontoggle={() => {
              if (accountMenu?.open && preferencesMenu) preferencesMenu.open = false;
            }}
          >
            <summary aria-label={text('Moje konto', 'My account')}
              ><span class="account-avatar">{initials}</span><span class="account-name"
                >{data.user.firstName || data.user.name}</span
              ><ChevronDown size={14} aria-hidden="true" /></summary
            >
            <div class="menu-panel account-panel">
              <strong>{data.user.firstName || data.user.name} {data.user.lastName}</strong>
              <span class="muted">{text('Ustawienia konta', 'Account settings')}</span>
              <button class="account-action" disabled={busy} onclick={() => changeTab('profile')}
                ><UserRound size={16} aria-hidden="true" />{text(
                  'Mój profil',
                  'My profile'
                )}</button
              >
              <form method="POST" action="/logout">
                <button class="account-action sign-out"
                  ><LogOut size={16} aria-hidden="true" />{text('Wyloguj się', 'Sign out')}</button
                >
              </form>
            </div>
          </details>
        </div>
      </header>
      <main class="dash-workspace" aria-busy={loading || busy}>
        {#if error}<p class="error" role="alert">{error}</p>{/if}
        {#if loading}<Skeleton
            board={tab === 'board'}
            label={text('Ładowanie przestrzeni', 'Loading workspace')}
          />
        {:else}
          {#key page.url.pathname}<div class="workspace-view" in:fly={{ y: -6, duration: 160 }}>
              <!-- ── PROJECTS ──────────────────────────────────────────────────── -->
              {#if workspace !== 'project' || scope}
                {#if tab === 'projects'}
                  <div class="workspace-header">
                    <div>
                      <h1>{text('Projekty', 'Projects')}</h1>
                      <p class="workspace-description">
                        {text(
                          'Wybierz projekt i przejdź do wspólnej pracy.',
                          'Choose a project and start collaborating.'
                        )}
                      </p>
                    </div>
                    {#if data.user.role !== 'member'}
                      <button
                        class="btn"
                        disabled={busy}
                        onclick={() => {
                          changeTab('__create_project__');
                        }}
                      >
                        <Plus size={16} aria-hidden="true" />{text('Nowy projekt', 'New project')}
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
                          <a
                            class="btn"
                            aria-disabled={busy}
                            href={`/projects/${encodeURIComponent(project.slug)}`}
                            onclick={guardNavigation}
                          >
                            {text('Otwórz projekt', 'Open project')}
                            <ArrowUpRight size={15} aria-hidden="true" />
                          </a>
                        </div>
                      </article>
                    {/each}
                  </div>

                  {#if !loading && !projects.length && !error}
                    <div class="empty-state">
                      <h2>{text('Jeszcze nie ma projektów', 'No projects yet')}</h2>
                      <p>
                        {text('Nowe projekty pojawią się tutaj.', 'New projects will appear here.')}
                      </p>
                    </div>
                  {/if}
                {:else if tab === 'overview'}
                  <div class="workspace-header">
                    <div>
                      <h1>{workspaceName}</h1>
                      <p class="workspace-description">
                        {selectedProject?.description ||
                          text(
                            'Wspólne zadania, rozmowy i publikacje w jednym miejscu.',
                            'Shared tasks, conversations, and publications in one place.'
                          )}
                      </p>
                    </div>
                    {#if selectedProject}
                      <button
                        class="btn btn-outline"
                        disabled={busy}
                        onclick={() =>
                          action(() => api(`/platform/projects/${scope}/join`, 'POST'))}
                        >{text('Dołącz do projektu', 'Join project')}</button
                      >
                    {/if}
                  </div>
                  <div class="workspace-shortcuts">
                    {#each [['board', 'Kanban', text('Zaplanuj i śledź wspólne zadania.', 'Plan and track shared tasks.')], ['forum', 'Forum', text('Rozmawiaj, zadawaj pytania i dziel się pomysłami.', 'Discuss, ask questions, and share ideas.')], ['articles', text('Artykuły', 'Articles'), text('Twórz publikacje i proponuj zmiany.', 'Write publications and propose changes.')]] as [key, label, description]}
                      <a
                        class="workspace-shortcut"
                        aria-disabled={busy}
                        href={dashboardPath(workspace, projectSlug, key)}
                        onclick={guardNavigation}
                        ><span class="shortcut-heading"
                          >{label}<ArrowUpRight size={16} aria-hidden="true" /></span
                        ><span>{description}</span></a
                      >
                    {/each}
                  </div>

                  <!-- ── ARTICLES ──────────────────────────────────────────────────── -->
                {:else if tab === 'articles'}
                  <div class="workspace-header">
                    <div>
                      <h1>{text('Artykuły', 'Articles')}</h1>
                    </div>
                    <button
                      class="btn"
                      disabled={busy}
                      onclick={() => {
                        selectedArticle = null;
                        newArticle = true;
                        title = '';
                        markdown = '';
                        slug = '';
                      }}
                    >
                      <Plus size={16} aria-hidden="true" />{text('Nowy artykuł', 'New article')}
                    </button>
                  </div>

                  {#each articles as article (article.id)}
                    <div
                      class="list-strip"
                      role="button"
                      tabindex="0"
                      onclick={() => {
                        selectedArticle = article;
                        slug = article.slug;
                        title = article.title;
                        markdown = article.markdown;
                      }}
                      onkeydown={(e) =>
                        e.key === 'Enter' &&
                        (() => {
                          selectedArticle = article;
                          slug = article.slug;
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

                  {#if !loading && !articles.length && !newArticle}<p class="muted">
                      {text(
                        'Brak artykułów. Utwórz pierwszy artykuł w tej przestrzeni.',
                        'No articles yet. Create the first article in this workspace.'
                      )}
                    </p>{/if}
                  {#if selectedArticle || newArticle}
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
                      <Editor {language} bind:value={markdown} />
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
                          <button
                            class="btn"
                            disabled={busy || !title.trim()}
                            onclick={() => action(create)}
                          >
                            {text('Utwórz', 'Create')}
                          </button>
                        {/if}
                      </div>
                    </div>
                  {/if}

                  <!-- ── BOARD ─────────────────────────────────────────────────────── -->
                {:else if tab === 'board'}
                  <div class="workspace-header">
                    <h1>
                      {graveyard
                        ? text('Usunięte zadania', 'Removed tasks')
                        : text('Tablica zadań', 'Task board')}
                    </h1>
                    {#if graveyard}
                      <a
                        class="btn btn-outline"
                        href={dashboardPath(workspace, projectSlug, 'board')}
                        onclick={guardNavigation}
                        ><ArrowLeft size={15} aria-hidden="true" />{text(
                          'Wróć do tablicy',
                          'Back to board'
                        )}</a
                      >
                    {:else}
                      <a
                        class="btn btn-outline"
                        href={`${dashboardPath(workspace, projectSlug, 'board')}/graveyard`}
                        onclick={guardNavigation}
                        ><Trash2 size={15} aria-hidden="true" />{text(
                          'Usunięte zadania',
                          'Removed tasks'
                        )}</a
                      >
                    {/if}
                  </div>
                  {#if graveyard}
                    <div class="graveyard-notice">
                      <Archive size={18} aria-hidden="true" />
                      <p>
                        {text(
                          'Usunięte zadania są zachowane tutaj. Liderzy mogą przywrócić je do poprzedniej kolumny.',
                          'Removed tasks are kept here. Leaders can restore them to their previous column.'
                        )}
                      </p>
                    </div>
                    <div class="graveyard-list">
                      {#each items as item (item.id)}
                        <article class="removed-task">
                          <div class="removed-task-info">
                            <h2>{item.title}</h2>
                            <p>{item.markdown.slice(0, 180)}</p>
                            <span class="tag"
                              >{columnDefs.find(([key]) => key === item.column)?.[1]}</span
                            >
                            {#if item.deletedAt}<time datetime={item.deletedAt}
                                >{new Date(item.deletedAt).toLocaleDateString(
                                  language === 'pl' ? 'pl-PL' : 'en-GB'
                                )}</time
                              >{/if}
                          </div>
                          <button
                            class="btn btn-outline"
                            disabled={busy}
                            onclick={() =>
                              action(() =>
                                api(`/platform/items/${item.id}/restore`, 'POST', {
                                  version: item.version
                                })
                              )}
                            ><RotateCcw size={15} aria-hidden="true" />{text(
                              'Przywróć',
                              'Restore'
                            )}</button
                          >
                        </article>
                      {/each}
                      {#if !loading && !items.length && !error}<div class="empty-state">
                          <Trash2 size={28} strokeWidth={1.4} aria-hidden="true" />
                          <h2>{text('Brak usuniętych zadań', 'No removed tasks')}</h2>
                          <p>
                            {text(
                              'Zadania usunięte z tablicy pojawią się tutaj.',
                              'Tasks removed from the board will appear here.'
                            )}
                          </p>
                        </div>{/if}
                    </div>
                  {:else}
                    <div class="board">
                      {#each columnDefs as [column, label] (column)}
                        <section class="board-column" aria-label={label}>
                          <div class="column-header">
                            <span class="column-label"
                              ><span class={`column-dot ${column}`}></span>{label}<span
                                class="column-count"
                                >{items.filter((item) => item.column === column).length}</span
                              ></span
                            >
                            <button
                              id={`add-${column}`}
                              type="button"
                              class="icon-button"
                              aria-label={`${text('Dodaj zadanie do', 'Add task to')} ${label}`}
                              disabled={busy}
                              onclick={() => openTaskComposer(column)}
                              ><Plus size={17} aria-hidden="true" /></button
                            >
                          </div>
                          <div class="column-items">
                            {#each items.filter((item) => item.column === column) as item (item.id)}
                              <article class="kanban-card">
                                <strong>{item.title}</strong>
                                {#if item.markdown}<p>
                                    {item.markdown.slice(0, 120)}{item.markdown.length > 120
                                      ? '…'
                                      : ''}
                                  </p>{/if}
                                <div class="kanban-card-actions">
                                  <Dropdown
                                    variant="compact"
                                    label={text('Przenieś zadanie', 'Move task')}
                                    value={item.column}
                                    options={columnOptions}
                                    disabled={busy}
                                    onselect={(column) =>
                                      action(() =>
                                        api(`/platform/items/${item.id}`, 'PATCH', {
                                          version: item.version,
                                          column
                                        })
                                      )}
                                  />
                                  <button
                                    class="icon-button danger-button"
                                    aria-label={`${text('Usuń zadanie', 'Remove task')}: ${item.title}`}
                                    disabled={busy}
                                    onclick={() =>
                                      action(() =>
                                        api(`/platform/items/${item.id}`, 'DELETE', {
                                          version: item.version
                                        })
                                      )}><Trash2 size={15} aria-hidden="true" /></button
                                  >
                                </div>
                              </article>
                            {/each}
                          </div>
                          {#if composer && taskColumn === column}
                            <form
                              class="column-composer"
                              onsubmit={(event) => {
                                event.preventDefault();
                                void action(create);
                              }}
                            >
                              <label for="task-title" class="sr-only"
                                >{text('Tytuł zadania', 'Task title')}</label
                              >
                              <input
                                id="task-title"
                                bind:value={title}
                                placeholder={text('Co trzeba zrobić?', 'What needs to be done?')}
                                required
                              />
                              <Editor {language} bind:value={markdown} />
                              <div class="composer-actions">
                                <button class="btn" disabled={busy || !title.trim()}
                                  ><Plus size={15} aria-hidden="true" />{text(
                                    'Dodaj zadanie',
                                    'Add task'
                                  )}</button
                                >
                                <button
                                  class="icon-button"
                                  type="button"
                                  aria-label={text(
                                    'Anuluj dodawanie zadania',
                                    'Cancel task creation'
                                  )}
                                  disabled={busy}
                                  onclick={() => {
                                    composer = false;
                                    document.getElementById(`add-${column}`)?.focus();
                                  }}><X size={17} aria-hidden="true" /></button
                                >
                              </div>
                            </form>
                          {:else}
                            <button
                              class="column-add"
                              disabled={busy}
                              onclick={() => openTaskComposer(column)}
                              ><Plus size={16} aria-hidden="true" />{text(
                                'Dodaj zadanie',
                                'Add task'
                              )}</button
                            >
                          {/if}
                        </section>
                      {/each}
                    </div>
                  {/if}

                  <!-- ── FORUM ─────────────────────────────────────────────────────── -->
                {:else if tab === 'forum'}
                  <div class="workspace-header">
                    <div>
                      <h1>Forum</h1>
                    </div>
                    <div class="row">
                      <button
                        class="btn"
                        disabled={busy}
                        onclick={async () => {
                          title = '';
                          markdown = '';
                          selectedThread = null;
                          composer = true;
                          await tick();
                          document.getElementById('thread-title')?.focus();
                        }}
                        ><Plus size={16} aria-hidden="true" />{text(
                          'Nowy wątek',
                          'New thread'
                        )}</button
                      >
                      <div
                        class="segmented-control"
                        role="group"
                        aria-label={text('Widok forum', 'Forum view')}
                      >
                        <button
                          type="button"
                          class:active={!archived}
                          aria-pressed={!archived}
                          onclick={() => {
                            archived = false;
                            selectedThread = null;
                            void load(true);
                          }}>{text('Aktywne', 'Active')}</button
                        >
                        <button
                          type="button"
                          class:active={archived}
                          aria-pressed={archived}
                          onclick={() => {
                            archived = true;
                            selectedThread = null;
                            void load(true);
                          }}
                          ><Archive size={14} aria-hidden="true" />{text(
                            'Archiwum',
                            'Archive'
                          )}</button
                        >
                      </div>
                    </div>
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
                      <h2 style="font-size: 1.1rem; margin-bottom: 12px;">
                        {selectedThread.title}
                      </h2>
                      {#each selectedThread.comments ?? [] as comment (comment.id)}
                        <div
                          style="border-top: 1px solid var(--line); padding: 12px 0; font-size: 13px; white-space: pre-wrap;"
                        >
                          {comment.markdown}
                        </div>
                      {/each}
                      <div style="margin-top: 16px; display: grid; gap: 8px;">
                        <label for="reply-md">{text('Odpowiedź', 'Reply')}</label>
                        <Editor {language} bind:value={markdown} />
                        <div class="row" style="gap: 8px;">
                          <button
                            class="btn"
                            disabled={busy}
                            onclick={() =>
                              action(() =>
                                api(`/platform/threads/${selectedThread!.id}/comments`, 'POST', {
                                  markdown
                                })
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
                  {#if composer}
                    <div class="card" style="margin-top: 20px;">
                      <h2 style="font-size: 1rem; margin-bottom: 14px;">
                        {text('Nowy wątek', 'New thread')}
                      </h2>
                      <label for="thread-title">{text('Temat', 'Subject')}</label>
                      <input id="thread-title" bind:value={title} required />
                      <label for="thread-vis">{text('Widoczność', 'Visibility')}</label>
                      <Dropdown
                        id="thread-vis"
                        label={text('Widoczność', 'Visibility')}
                        bind:value={visibility}
                        options={[
                          {
                            value: 'association',
                            label: text('Członkowie koła', 'Association members')
                          },
                          ...(scope
                            ? [
                                {
                                  value: 'members',
                                  label: text('Członkowie projektu', 'Project members')
                                }
                              ]
                            : []),
                          { value: 'leaders', label: text('Liderzy', 'Leaders') }
                        ]}
                      />

                      <Editor {language} bind:value={markdown} />
                      <button
                        class="btn"
                        disabled={busy || !title.trim()}
                        onclick={() => action(create)}
                        style="margin-top: 12px;"
                      >
                        {text('Utwórz wątek', 'Create thread')}
                      </button>
                    </div>
                  {/if}

                  <!-- ── PROFILE ────────────────────────────────────────────────────── -->
                {:else if tab === 'profile'}
                  <form
                    class="profile-form"
                    onsubmit={(event) => {
                      event.preventDefault();
                      void saveProfile();
                    }}
                    oninput={() => (profileSaved = false)}
                  >
                    <div class="workspace-header">
                      <div>
                        <h1>{text('Profil', 'Profile')}</h1>
                        <p class="workspace-description">
                          {text(
                            'Przedstaw się członkom koła i zdecyduj, co pokażesz publicznie.',
                            'Introduce yourself to the association and choose what to share publicly.'
                          )}
                        </p>
                      </div>
                      <div class="profile-save">
                        <span role="status"
                          >{#if profileSaved}<Check size={15} aria-hidden="true" />{text(
                              'Zapisano',
                              'Saved'
                            )}{/if}</span
                        ><button class="btn" disabled={busy}
                          ><Save size={16} aria-hidden="true" />{text(
                            'Zapisz zmiany',
                            'Save changes'
                          )}</button
                        >
                      </div>
                    </div>
                    <div class="profile-grid">
                      <section
                        class="profile-section profile-identity"
                        aria-labelledby="identity-heading"
                      >
                        <div class="section-heading">
                          <UserRound size={18} aria-hidden="true" />
                          <h2 id="identity-heading">{text('O Tobie', 'About you')}</h2>
                        </div>
                        <div class="profile-fields">
                          <div>
                            <label for="p-first">{text('Imię', 'First name')}</label><input
                              id="p-first"
                              bind:value={profile.firstName}
                              required
                            />
                          </div>
                          <div>
                            <label for="p-last">{text('Nazwisko', 'Last name')}</label><input
                              id="p-last"
                              bind:value={profile.lastName}
                            />
                          </div>
                          <div class="field-wide">
                            <label for="p-nick">{text('Pseudonim', 'Nickname')}</label><input
                              id="p-nick"
                              bind:value={profile.nickname}
                              placeholder={text(
                                'Jak możemy Cię nazywać?',
                                'What should we call you?'
                              )}
                            />
                          </div>
                          <div class="field-wide">
                            <label for="p-bio"
                              >{text('Kilka słów o sobie', 'A little about you')}</label
                            ><textarea
                              id="p-bio"
                              bind:value={profile.bio}
                              placeholder={text(
                                'Zainteresowania, projekty i rzeczy, które lubisz robić…',
                                'Interests, projects, and things you enjoy…'
                              )}
                            ></textarea>
                          </div>
                        </div>
                      </section>
                      <section
                        class="profile-section profile-preview"
                        aria-labelledby="preview-heading"
                      >
                        <div class="section-heading">
                          <Shield size={18} aria-hidden="true" />
                          <h2 id="preview-heading">{text('Profil publiczny', 'Public profile')}</h2>
                        </div>
                        <div class="profile-preview-card">
                          {#if profile.image}<img
                              src={profile.image}
                              alt=""
                              class="profile-avatar"
                            />{:else}<span class="profile-avatar"
                              >{`${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() ||
                                'K'}</span
                            >{/if}<strong>{publicName}</strong>
                          <p>
                            {profile.bio ||
                              text(
                                'Twój publiczny profil na stronie KSI.',
                                'Your public profile on the KSI website.'
                              )}
                          </p>
                        </div>
                        <label for="p-priv"
                          >{text('Widoczność imienia i nazwiska', 'Name visibility')}</label
                        >
                        <Dropdown
                          id="p-priv"
                          label={text('Widoczność imienia i nazwiska', 'Name visibility')}
                          value={profile.publicPrivacy}
                          options={privacyOptions}
                          onselect={(value) => {
                            profile.publicPrivacy = value as Profile['publicPrivacy'];
                            profileSaved = false;
                          }}
                        />
                        <p class="field-help">
                          {text(
                            'Dotyczy strony publicznej. W dashboardzie członkowie widzą pełne imię i nazwisko.',
                            'Applies to the public website. Members see your full name in the dashboard.'
                          )}
                        </p>
                      </section>
                      <section
                        class="profile-section profile-links"
                        aria-labelledby="links-heading"
                      >
                        <div class="section-heading">
                          <ArrowUpRight size={18} aria-hidden="true" />
                          <h2 id="links-heading">
                            {text('Znajdź mnie w sieci', 'Find me online')}
                          </h2>
                        </div>
                        <div class="profile-fields">
                          <div>
                            <label for="p-gh"><Github size={14} aria-hidden="true" />GitHub</label
                            ><input
                              id="p-gh"
                              type="url"
                              bind:value={profile.github}
                              placeholder="https://github.com/…"
                            />
                          </div>
                          <div>
                            <label for="p-li"
                              ><Linkedin size={14} aria-hidden="true" />LinkedIn</label
                            ><input
                              id="p-li"
                              type="url"
                              bind:value={profile.linkedin}
                              placeholder="https://linkedin.com/in/…"
                            />
                          </div>
                        </div>
                      </section>
                    </div>
                  </form>
                  <section class="profile-section account-danger">
                    <details>
                      <summary
                        ><Trash2 size={17} aria-hidden="true" />{text(
                          'Usuń konto',
                          'Delete account'
                        )}<ChevronDown size={15} aria-hidden="true" /></summary
                      >
                      <p class="field-help">
                        {text(
                          'Profil zostanie zanonimizowany. Treści pozostają własnością koła.',
                          'Your profile will be anonymized. Association content remains.'
                        )}
                      </p>
                      <button
                        class="btn btn-outline danger-button"
                        disabled={busy}
                        onclick={() =>
                          action(async () => {
                            await api('/users/me', 'DELETE');
                            location.reload();
                          })}
                        >{text('Potwierdzam usunięcie konta', 'Confirm account deletion')}</button
                      >
                    </details>
                  </section>

                  <!-- ── USERS (admin/board) ────────────────────────────────────────── -->
                {:else if tab === 'users'}
                  <div class="workspace-header">
                    <div>
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
                              <small
                                style="font-family: var(--mono); font-size: 10px; color: var(--muted);"
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
                              <span
                                class="tag {member.role === 'administrator' ? 'tag-lavender' : ''}"
                                >{member.role}</span
                              >
                            </td>
                            <td>
                              <button
                                disabled={busy}
                                onclick={() =>
                                  action(() =>
                                    api(`/users/${member.id}/access`, 'PATCH', {
                                      membershipStatus: 'active'
                                    })
                                  )}
                              >
                                {text('Aktywuj', 'Activate')}
                              </button>
                              {#if data.user.role === 'administrator'}
                                <Dropdown
                                  variant="compact"
                                  label={text('Rola członka', 'Member role')}
                                  value={member.role}
                                  disabled={busy}
                                  options={[
                                    { value: 'member', label: text('Członek', 'Member') },
                                    { value: 'board', label: text('Zarząd', 'Board') },
                                    {
                                      value: 'administrator',
                                      label: text('Administrator', 'Administrator')
                                    }
                                  ]}
                                  onselect={(role) =>
                                    action(() =>
                                      api(`/users/${member.id}/access`, 'PATCH', { role })
                                    )}
                                />

                                <button
                                  disabled={busy}
                                  style="color: var(--danger);"
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
                      <ArrowLeft size={15} aria-hidden="true" />{text('Wróć', 'Back')}
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
                    <Editor {language} bind:value={markdown} />
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
              {/if}
            </div>{/key}
        {/if}
      </main>
    </div>
  </div>
{/if}
