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
  import KanbanBoard, { type BoardStatus } from '$lib/KanbanBoard.svelte';
  import ApprovalInbox, { type InboxData } from '$lib/ApprovalInbox.svelte';
  import AvatarUpload, { type AvatarRequest } from '$lib/AvatarUpload.svelte';
  import { validProfileLink } from 'shared/profile-links';
  import Skeleton from '$lib/Skeleton.svelte';
  import { fly } from 'svelte/transition';
  import MarkdownContent from '@ksi-core/ui/platform/MarkdownContent.svelte';
  import Members from '$lib/Members.svelte';
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
    Archive,
    Bell
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
    column: string;
    version: number;
    position: number;
    tags: string[];
    deletedAt?: string;
  };
  type Thread = {
    id: string;
    title: string;
    visibility: string;
    projectId?: string | null;
    archivedAt?: string | null;
    version: number;
    createdAt?: string;
    comments?: { id: string; markdown: string; authorName?: string; createdAt?: string }[];
  };

  let projects = $state<Project[]>([]);
  let articles = $state<Article[]>([]);
  let items = $state<Item[]>([]);
  let threads = $state<Thread[]>([]);

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
  let statuses = $state<BoardStatus[]>([
    { id: 'todo', name: 'To do' },
    { id: 'progress', name: 'In progress' },
    { id: 'done', name: 'Done' }
  ]);
  let boardLeader = $state(false);
  let inbox = $state<InboxData>({ memberships: [], avatars: [] });
  let avatarRequest = $state<AvatarRequest | null>(null);
  const inboxCount = $derived(inbox.memberships.length + inbox.avatars.length);
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
      if (data.user.role !== 'member') {
        try {
          const result = await api<InboxData>('/users/inbox');
          if (generation === loadGeneration) inbox = result;
        } catch {
          /* Permission denials must not block unrelated workspace pages. */
        }
      }
      if (currentTab === 'profile') {
        const request = await api<AvatarRequest | null>('/users/me/avatar-request');
        const current = await api<{ user: Profile }>('/users/me');
        if (generation === loadGeneration) {
          avatarRequest = request;
          profile.image = current.user.image;
        }
      }
      if (workspace === 'project') {
        const project = projectList.find((project) => project.slug === projectSlug);
        if (!project) {
          error = 'Project not found.';
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
        let board: { id: string; statuses: BoardStatus[] } | null = null;
        try {
          board = await api<{ id: string; statuses: BoardStatus[] }>(`/platform/boards${query}`);
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
          statuses = board?.statuses ?? [
            { id: 'todo', name: 'To do' },
            { id: 'progress', name: 'In progress' },
            { id: 'done', name: 'Done' }
          ];
          items = result;
          const roster = currentScope
            ? await api<{ id: string; leader: boolean }[]>(
                `/platform/projects/${currentScope}/members`
              )
            : [];
          if (generation === loadGeneration)
            boardLeader =
              data.user.role !== 'member' ||
              roster.some((member) => member.id === data.user.id && member.leader);
        }
      }
      if (currentTab === 'forum') {
        const threadId = parseDashboardPath(page.url.pathname)?.threadId;
        if (threadId) {
          const detail = await api<Thread>(`/platform/threads/${encodeURIComponent(threadId)}`);
          if ((detail.projectId ?? null) !== (currentScope || null))
            throw new Error('This thread belongs to another workspace.');
          if (generation === loadGeneration) {
            selectedThread = detail;
            archived = !!detail.archivedAt;
          }
        } else {
          const result = await api<Thread[]>(
            `/platform/threads?archived=${archived}${currentScope ? `&projectId=${encodeURIComponent(currentScope)}` : ''}`
          );
          if (generation === loadGeneration) {
            threads = result;
            selectedThread = null;
          }
        }
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

  async function saveProfile() {
    profileSaved = false;
    if (!validProfileLink('github', profile.github)) {
      error = 'Enter a https://github.com/username profile link.';
      return;
    }
    if (!validProfileLink('linkedin', profile.linkedin)) {
      error = 'Enter a https://linkedin.com/in/username profile link.';
      return;
    }
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
    if (tab === 'forum') {
      const result = await api<Thread>('/platform/threads', 'POST', {
        title,
        markdown,
        visibility,
        invitedIds: [],
        ...(scope ? { projectId: scope } : {})
      });
      composer = false;
      title = '';
      markdown = '';
      await goto(
        `${dashboardPath(workspace, projectSlug, 'forum')}/${encodeURIComponent(result.id)}`
      );
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

  const columnDefs = $derived(
    statuses.map((status) => [
      status.id,
      status.id === 'todo'
        ? 'To do'
        : status.id === 'progress'
          ? 'In progress'
          : status.id === 'done'
            ? 'Done'
            : status.name
    ])
  );

  const tabs = $derived([
    ['overview', 'Overview'],
    ['board', 'Kanban'],
    ['forum', 'Forum'],
    ['articles', 'Articles'],
    ['events', 'Activity']
  ] as [string, string][]);
  const selectedProject = $derived(projects.find((project) => project.slug === projectSlug));
  const workspaceName = $derived(
    workspace === 'project' ? (selectedProject?.name ?? 'Project') : 'Association'
  );
  const viewName = $derived(
    graveyard && tab === 'board'
      ? 'Removed tasks'
      : tab === 'inbox'
        ? 'Approval inbox'
        : tab === 'projects'
          ? 'Projects'
          : tab === 'profile'
            ? 'My profile'
            : tab === 'users'
              ? 'Members'
              : tab === '__create_project__'
                ? 'New project'
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
    { value: 'directory', label: 'All projects', href: '/projects' },
    { value: 'association', label: 'Association', href: '/association' },
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
  const privacyOptions = $derived([
    { value: 'full-name', label: 'Full name' },
    { value: 'last-initial', label: 'First name + last initial' },
    { value: 'initials', label: 'Initials only' }
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
      <h1>{'Account activation required'}</h1>
      <p>
        {'Your account first needs to be activated by an administrator. Ask directly:'}
        {data.activationContact}.
      </p>
      <form method="POST" action="/logout">
        <button class="btn" style="margin: 0 auto;">
          {'Sign out'}
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
        aria-label={'Close navigation'}
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
      aria-label={'Navigation'}
    >
      <div class="sidebar-brand">
        <span class="sidebar-logo">KSI<span> / core</span></span>
        <button
          class="mobile-close"
          onclick={() => {
            mobileNavigation = false;
            document.getElementById('navigation-toggle')?.focus();
          }}
          aria-label={'Close navigation'}><X size={20} aria-hidden="true" /></button
        >
      </div>
      <div class="sidebar-context">
        <Dropdown
          label={'Choose workspace'}
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
          searchPlaceholder={'Search projects…'}
          emptyLabel={'No projects found.'}
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
          ><span class="navigation-label"><Folder size={16} aria-hidden="true" />{'Projects'}</span
          ></a
        >
        <a class="sidebar-btn" aria-disabled={busy} href="/association" onclick={guardNavigation}>
          <span class="navigation-label"><Users size={16} aria-hidden="true" />{'Association'}</span
          ><ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <p class="sidebar-hint">
          {'Choose a project to open its board, forum, and articles.'}
        </p>
      {/if}
      <div class="sidebar-global">
        {#if workspace === 'project'}
          <a class="sidebar-btn" aria-disabled={busy} href="/association" onclick={guardNavigation}
            ><span class="navigation-label"
              ><Users size={16} aria-hidden="true" />{'Association'}</span
            ><ArrowUpRight size={14} aria-hidden="true" /></a
          >
        {/if}
        {#if data.user.role !== 'member'}
          <span class="sidebar-section">{'Association management'}</span>
          <a
            class="sidebar-btn"
            class:active={tab === 'users'}
            aria-disabled={busy}
            aria-current={tab === 'users' ? 'page' : undefined}
            href="/members"
            onclick={guardNavigation}>{'Members'}</a
          >
        {/if}
        <a class="sidebar-btn" href={data.websiteOrigin}>{'KSI website ↗'}</a>
        <div class="sidebar-footnote">
          KSI · {'University of Wrocław'}
          <div class="build-details">
            v{import.meta.env.PUBLIC_APP_VERSION} ·
            <a
              href={import.meta.env.PUBLIC_COMMIT_HASH
                ? `https://github.com/ksiuwr/ksi-core/commit/${import.meta.env.PUBLIC_COMMIT_HASH}`
                : 'https://github.com/ksiuwr/ksi-core'}
              target="_blank"
              rel="noopener noreferrer"
              >{import.meta.env.PUBLIC_COMMIT_HASH?.slice(0, 7) || 'Source'}</a
            >
          </div>
        </div>
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
            >{'Navigation'}</span
          >
        </button>
        <div class="workspace-breadcrumb" aria-label={'Current workspace'}>
          <a
            href={workspace === 'directory'
              ? '/projects'
              : dashboardPath(workspace, projectSlug, 'overview')}
            onclick={guardNavigation}>{workspace === 'directory' ? 'KSI' : workspaceName}</a
          ><span aria-hidden="true">/</span><strong>{viewName}</strong>
        </div>
        <div class="topbar-controls">
          {#if data.user.role !== 'member'}<a
              class="icon-button inbox-link"
              href="/inbox"
              aria-label={`${'Approval inbox'}: ${inboxCount}`}
              onclick={guardNavigation}
              ><Bell size={18} aria-hidden="true" />{#if inboxCount}<span class="inbox-badge"
                  >{inboxCount}</span
                >{/if}</a
            >{/if}
          <details
            class="topbar-menu"
            bind:this={preferencesMenu}
            ontoggle={() => {
              if (preferencesMenu?.open && accountMenu) accountMenu.open = false;
            }}
          >
            <summary aria-label={'Language and appearance'}
              ><SunMoon size={18} aria-hidden="true" /><span class="preferences-label"
                >{'Preferences'}</span
              ></summary
            >
            <div class="menu-panel preferences-panel">
              <label for="dashboard-language">{'Language'}</label>
              <Dropdown
                id="dashboard-language"
                label={'Language'}
                value={language}
                options={[
                  { value: 'pl', label: 'Polski' },
                  { value: 'en', label: 'English' }
                ]}
                onselect={(value) => setLanguage(value as 'pl' | 'en')}
              />
              <label for="dashboard-theme">{'Appearance'}</label>
              <Dropdown
                id="dashboard-theme"
                label={'Appearance'}
                value={preferences.theme}
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' }
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
            <summary aria-label={'My account'}
              ><span class="account-avatar"
                >{#if data.user.image}<img
                    src={data.user.image}
                    alt=""
                  />{:else}{initials}{/if}</span
              ><span class="account-name">{data.user.firstName || data.user.name}</span><ChevronDown
                size={14}
                aria-hidden="true"
              /></summary
            >
            <div class="menu-panel account-panel">
              <strong>{data.user.firstName || data.user.name} {data.user.lastName}</strong>
              <span class="muted">{'Account settings'}</span>
              <button class="account-action" disabled={busy} onclick={() => changeTab('profile')}
                ><UserRound size={16} aria-hidden="true" />{'My profile'}</button
              >
              <form method="POST" action="/logout">
                <button class="account-action sign-out"
                  ><LogOut size={16} aria-hidden="true" />{'Sign out'}</button
                >
              </form>
            </div>
          </details>
        </div>
      </header>
      <main class="dash-workspace" aria-busy={loading || busy}>
        {#if error}<p class="error" role="alert">{error}</p>{/if}
        {#if loading}<Skeleton board={tab === 'board'} label={'Loading workspace'} />
        {:else}
          {#key page.url.pathname}<div class="workspace-view" in:fly={{ y: -6, duration: 160 }}>
              <!-- ── PROJECTS ──────────────────────────────────────────────────── -->
              {#if workspace !== 'project' || scope}
                {#if tab === 'projects'}
                  <div class="workspace-header">
                    <div>
                      <h1>{'Projects'}</h1>
                      <p class="workspace-description">
                        {'Choose a project and start collaborating.'}
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
                        <Plus size={16} aria-hidden="true" />{'New project'}
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
                            <span class="tag">{'Locked'}</span>
                          {/if}
                        </div>
                        <h2>{project.name}</h2>
                        <p>{project.description || 'No description.'}</p>
                        <div class="project-card-actions">
                          <a
                            class="btn"
                            aria-disabled={busy}
                            href={`/projects/${encodeURIComponent(project.slug)}`}
                            onclick={guardNavigation}
                          >
                            {'Open project'}
                            <ArrowUpRight size={15} aria-hidden="true" />
                          </a>
                        </div>
                      </article>
                    {/each}
                  </div>

                  {#if !loading && !projects.length && !error}
                    <div class="empty-state">
                      <h2>{'No projects yet'}</h2>
                      <p>
                        {'New projects will appear here.'}
                      </p>
                    </div>
                  {/if}
                {:else if tab === 'overview'}
                  <div class="workspace-header">
                    <div>
                      <h1>{workspaceName}</h1>
                      <p class="workspace-description">
                        {selectedProject?.description ||
                          'Shared tasks, conversations, and publications in one place.'}
                      </p>
                    </div>
                    {#if selectedProject}
                      <button
                        class="btn btn-outline"
                        disabled={busy}
                        onclick={() =>
                          action(() => api(`/platform/projects/${scope}/join`, 'POST'))}
                        >{'Join project'}</button
                      >
                    {/if}
                  </div>
                  <div class="workspace-shortcuts">
                    {#each [['board', 'Kanban', 'Plan and track shared tasks.'], ['forum', 'Forum', 'Discuss, ask questions, and share ideas.'], ['articles', 'Articles', 'Write publications and propose changes.']] as [key, label, description]}
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
                      <h1>{'Articles'}</h1>
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
                      <Plus size={16} aria-hidden="true" />{'New article'}
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
                      {'No articles yet. Create the first article in this workspace.'}
                    </p>{/if}
                  {#if selectedArticle || newArticle}
                    <div class="card" style="margin-top: 20px;">
                      <h2 style="font-size: 1.1rem; margin-bottom: 16px;">
                        {selectedArticle ? 'Edit article' : 'New article'}
                      </h2>
                      <label for="a-title">{'Title'}</label>
                      <input id="a-title" bind:value={title} required />
                      <label for="a-slug">Slug</label>
                      <input id="a-slug" bind:value={slug} />
                      <Editor {language} allowGallery bind:value={markdown} />
                      <div class="row" style="margin-top: 16px; gap: 8px;">
                        {#if selectedArticle}
                          <button
                            class="btn"
                            disabled={busy}
                            onclick={() => action(() => saveArticle(false))}
                          >
                            {'Save draft'}
                          </button>
                          <button
                            class="btn-coral btn"
                            disabled={busy}
                            onclick={() => action(() => saveArticle(true))}
                          >
                            {'Publish'}
                          </button>
                          <button disabled={busy} onclick={() => action(propose)}>
                            {'Propose edit'}
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
                            {'Show my author credit'}
                          </label>
                        {:else}
                          <button
                            class="btn"
                            disabled={busy || !title.trim()}
                            onclick={() => action(create)}
                          >
                            {'Create'}
                          </button>
                        {/if}
                      </div>
                    </div>
                  {/if}

                  <!-- ── BOARD ─────────────────────────────────────────────────────── -->
                {:else if tab === 'board'}
                  <div class="workspace-header">
                    <h1>
                      {graveyard ? 'Removed tasks' : 'Task board'}
                    </h1>
                    {#if graveyard}
                      <a
                        class="btn btn-outline"
                        href={dashboardPath(workspace, projectSlug, 'board')}
                        onclick={guardNavigation}
                        ><ArrowLeft size={15} aria-hidden="true" />{'Back to board'}</a
                      >
                    {:else}
                      <a
                        class="btn btn-outline"
                        href={`${dashboardPath(workspace, projectSlug, 'board')}/graveyard`}
                        onclick={guardNavigation}
                        ><Trash2 size={15} aria-hidden="true" />{'Removed tasks'}</a
                      >
                    {/if}
                  </div>
                  {#if graveyard}
                    <div class="graveyard-notice">
                      <Archive size={18} aria-hidden="true" />
                      <p>
                        {'Removed tasks are kept here. Leaders can restore them to their previous column.'}
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
                              )}><RotateCcw size={15} aria-hidden="true" />{'Restore'}</button
                          >
                        </article>
                      {/each}
                      {#if !loading && !items.length && !error}<div class="empty-state">
                          <Trash2 size={28} strokeWidth={1.4} aria-hidden="true" />
                          <h2>{'No removed tasks'}</h2>
                          <p>
                            {'Tasks removed from the board will appear here.'}
                          </p>
                        </div>{/if}
                    </div>
                  {:else}
                    <KanbanBoard
                      {items}
                      {statuses}
                      {boardId}
                      projectId={scope}
                      {language}
                      canManage={boardLeader}
                      refresh={() => load()}
                      reportError={(message) => (error = message)}
                    />
                  {/if}

                  <!-- ── FORUM ─────────────────────────────────────────────────────── -->
                {:else if tab === 'forum'}
                  {#if !data.navigation.threadId}
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
                          }}><Plus size={16} aria-hidden="true" />{'New thread'}</button
                        >
                        <div class="segmented-control" role="group" aria-label={'Forum view'}>
                          <button
                            type="button"
                            class:active={!archived}
                            aria-pressed={!archived}
                            onclick={() => {
                              archived = false;
                              selectedThread = null;
                              void load(true);
                            }}>{'Active'}</button
                          >
                          <button
                            type="button"
                            class:active={archived}
                            aria-pressed={archived}
                            onclick={() => {
                              archived = true;
                              selectedThread = null;
                              void load(true);
                            }}><Archive size={14} aria-hidden="true" />{'Archive'}</button
                          >
                        </div>
                      </div>
                    </div>

                    {#each threads as thread (thread.id)}
                      <a
                        class="list-strip forum-thread-link"
                        href={`${dashboardPath(workspace, projectSlug, 'forum')}/${encodeURIComponent(thread.id)}`}
                        onclick={guardNavigation}
                      >
                        <div class="list-strip-info">
                          <h3>{thread.title}</h3>
                          {#if thread.createdAt}<time
                              class="list-strip-meta"
                              datetime={thread.createdAt}
                              >{new Date(thread.createdAt).toLocaleDateString(
                                language === 'pl' ? 'pl-PL' : 'en-GB'
                              )}</time
                            >{/if}
                        </div>
                        <span class="tag"
                          >{thread.visibility === 'leaders'
                            ? 'Leaders'
                            : thread.visibility === 'members'
                              ? 'Project members'
                              : 'Association members'}</span
                        >
                      </a>
                    {/each}
                  {/if}

                  {#if selectedThread}
                    <div class="card" style="margin-top: 16px;">
                      <a
                        class="btn btn-outline"
                        href={dashboardPath(workspace, projectSlug, 'forum')}
                        style="margin-bottom:20px"
                        ><ArrowLeft size={15} aria-hidden="true" />{'All threads'}</a
                      >
                      <h1 style="font-size:clamp(24px,3vw,36px);margin-bottom:24px">
                        {selectedThread.title}
                      </h1>
                      {#if archived}<p class="notice">{'This thread is archived.'}</p>{/if}
                      {#each selectedThread.comments ?? [] as comment (comment.id)}
                        <div
                          style="border-top: 1px solid var(--line); padding: 12px 0; font-size: 13px; white-space: pre-wrap;"
                        >
                          {#if comment.authorName}<div class="forum-post-meta">
                              <strong>{comment.authorName}</strong>{#if comment.createdAt}<time
                                  datetime={comment.createdAt}
                                  >{new Date(comment.createdAt).toLocaleString(
                                    language === 'pl' ? 'pl-PL' : 'en-GB'
                                  )}</time
                                >{/if}
                            </div>{/if}
                          <MarkdownContent value={comment.markdown} {language} />
                        </div>
                      {/each}
                      <div style="margin-top: 16px; display: grid; gap: 8px;">
                        {#if !archived}<h3>{'Reply'}</h3>
                          <Editor {language} bind:value={markdown} />{/if}
                        <div class="row" style="gap: 8px;">
                          {#if !archived}<button
                              class="btn"
                              disabled={busy || !markdown.trim()}
                              onclick={() =>
                                action(async () => {
                                  await api(
                                    `/platform/threads/${selectedThread!.id}/comments`,
                                    'POST',
                                    { markdown }
                                  );
                                  markdown = '';
                                })}>{'Reply'}</button
                            >{/if}
                          <button
                            class="btn btn-outline"
                            disabled={busy}
                            onclick={() =>
                              action(() =>
                                api(`/platform/threads/${selectedThread!.id}/archive`, 'POST', {
                                  version: selectedThread!.version,
                                  archived: !archived
                                })
                              )}
                          >
                            {#if archived}<RotateCcw
                                size={15}
                                aria-hidden="true"
                              />{'Restore thread'}{:else}<Archive
                                size={15}
                                aria-hidden="true"
                              />{'Archive thread'}{/if}
                          </button>
                        </div>
                      </div>
                    </div>
                  {/if}

                  <!-- New thread form -->
                  {#if composer && !data.navigation.threadId}
                    <div class="card" style="margin-top: 20px;">
                      <h2 style="font-size: 1rem; margin-bottom: 14px;">
                        {'New thread'}
                      </h2>
                      <label for="thread-title">{'Subject'}</label>
                      <input id="thread-title" bind:value={title} required />
                      <label for="thread-vis">{'Visibility'}</label>
                      <Dropdown
                        id="thread-vis"
                        label={'Visibility'}
                        bind:value={visibility}
                        options={[
                          {
                            value: 'association',
                            label: 'Association members'
                          },
                          ...(scope
                            ? [
                                {
                                  value: 'members',
                                  label: 'Project members'
                                }
                              ]
                            : []),
                          { value: 'leaders', label: 'Leaders' }
                        ]}
                      />

                      <div class="forum-editor-gap">
                        <Editor {language} bind:value={markdown} />
                      </div>
                      <button
                        class="btn"
                        disabled={busy || !title.trim()}
                        onclick={() => action(create)}
                        style="margin-top: 12px;"
                      >
                        {'Create thread'}
                      </button>
                    </div>
                  {/if}

                  <!-- ── PROFILE ────────────────────────────────────────────────────── -->
                {:else if tab === 'inbox'}
                  <ApprovalInbox
                    {inbox}
                    {language}
                    administrator={data.user.role === 'administrator'}
                    refresh={async () => {
                      await load();
                      await invalidateAll();
                    }}
                    reportError={(message) => (error = message)}
                  />
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
                        <h1>{'Profile'}</h1>
                        <p class="workspace-description">
                          {'Introduce yourself to the association and choose what to share publicly.'}
                        </p>
                      </div>
                      <div class="profile-save">
                        <span role="status"
                          >{#if profileSaved}<Check
                              size={15}
                              aria-hidden="true"
                            />{'Saved'}{/if}</span
                        ><button class="btn" disabled={busy}
                          ><Save size={16} aria-hidden="true" />{'Save changes'}</button
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
                          <h2 id="identity-heading">{'About you'}</h2>
                        </div>
                        <div class="profile-fields">
                          <div>
                            <label for="p-first">{'First name'}</label><input
                              id="p-first"
                              bind:value={profile.firstName}
                              required
                            />
                          </div>
                          <div>
                            <label for="p-last">{'Last name'}</label><input
                              id="p-last"
                              bind:value={profile.lastName}
                            />
                          </div>
                          <div class="field-wide">
                            <label for="p-nick">{'Nickname'}</label><input
                              id="p-nick"
                              bind:value={profile.nickname}
                              placeholder={'What should we call you?'}
                            />
                          </div>
                          <div class="field-wide">
                            <label for="p-bio">{'A little about you'}</label><textarea
                              id="p-bio"
                              bind:value={profile.bio}
                              placeholder={'Interests, projects, and things you enjoy…'}
                            ></textarea>
                          </div>
                        </div>
                        <AvatarUpload
                          request={avatarRequest}
                          {language}
                          onchange={() => load()}
                          reportError={(message) => (error = message)}
                        />
                      </section>
                      <section
                        class="profile-section profile-preview"
                        aria-labelledby="preview-heading"
                      >
                        <div class="section-heading">
                          <Shield size={18} aria-hidden="true" />
                          <h2 id="preview-heading">{'Public profile'}</h2>
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
                          {#if profile.nickname?.trim()}<span class="profile-nickname"
                              >aka. {profile.nickname}</span
                            >{/if}
                          <p>
                            {profile.bio || 'Your public profile on the KSI website.'}
                          </p>
                          <div class="profile-socials">
                            {#if profile.github && validProfileLink('github', profile.github)}<a
                                class="btn btn-outline"
                                href={profile.github}
                                target="_blank"
                                rel="noopener noreferrer"><Github size={15} />GitHub</a
                              >{/if}
                            {#if profile.linkedin && validProfileLink('linkedin', profile.linkedin)}<a
                                class="btn btn-outline"
                                href={profile.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"><Linkedin size={15} />LinkedIn</a
                              >{/if}
                          </div>
                        </div>
                        <label for="p-priv">{'Name visibility'}</label>
                        <Dropdown
                          id="p-priv"
                          label={'Name visibility'}
                          value={profile.publicPrivacy}
                          options={privacyOptions}
                          onselect={(value) => {
                            profile.publicPrivacy = value as Profile['publicPrivacy'];
                            profileSaved = false;
                          }}
                        />
                        <p class="field-help">
                          {'Applies to the public website. Members see your full name in the dashboard.'}
                        </p>
                      </section>
                      <section
                        class="profile-section profile-links"
                        aria-labelledby="links-heading"
                      >
                        <div class="section-heading">
                          <ArrowUpRight size={18} aria-hidden="true" />
                          <h2 id="links-heading">
                            {'Find me online'}
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
                            {#if !validProfileLink('github', profile.github)}<p
                                class="field-error"
                                role="status"
                              >
                                {'Use a https://github.com/username link.'}
                              </p>{/if}
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
                            {#if !validProfileLink('linkedin', profile.linkedin)}<p
                                class="field-error"
                                role="status"
                              >
                                {'Use a https://linkedin.com/in/username link.'}
                              </p>{/if}
                          </div>
                        </div>
                      </section>
                    </div>
                  </form>
                  <section class="profile-section account-danger">
                    <details>
                      <summary
                        ><Trash2 size={17} aria-hidden="true" />{'Delete account'}<ChevronDown
                          size={15}
                          aria-hidden="true"
                        /></summary
                      >
                      <p class="field-help">
                        {'Your profile will be anonymized. Association content remains.'}
                      </p>
                      <button
                        class="btn btn-outline danger-button"
                        disabled={busy}
                        onclick={() =>
                          action(async () => {
                            await api('/users/me', 'DELETE');
                            location.reload();
                          })}>{'Confirm account deletion'}</button
                      >
                    </details>
                  </section>

                  <!-- ── USERS (admin/board) ────────────────────────────────────────── -->
                {:else if tab === 'users'}
                  {#if !data.navigation.memberId}
                    <div class="workspace-header">
                      <div>
                        <h1>{'Members'}</h1>
                      </div>
                    </div>
                  {/if}
                  <Members
                    {language}
                    administrator={data.user.role === 'administrator'}
                    memberId={data.navigation.memberId}
                  />

                  <!-- ── EVENTS ─────────────────────────────────────────────────────── -->
                {:else if tab === 'events'}
                  <div class="workspace-header">
                    <div>
                      <h1>{'Activity'}</h1>
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
                      {'No activity yet.'}
                    </p>
                  {/if}

                  <!-- ── CREATE PROJECT (board/admin only) ──────────────────────────── -->
                {:else if tab === '__create_project__'}
                  <div class="workspace-header">
                    <div>
                      <h1>{'New project'}</h1>
                    </div>
                    <button onclick={() => changeTab('projects')} style="font-size: 13px;">
                      <ArrowLeft size={15} aria-hidden="true" />{'Back'}
                    </button>
                  </div>
                  <div class="card" style="max-width: 600px;">
                    <label for="cp-title">{'Name'}</label>
                    <input id="cp-title" bind:value={title} required />
                    <label for="cp-slug">Slug</label>
                    <input id="cp-slug" bind:value={slug} />
                    <label for="cp-leaders">{'Leader IDs (comma-separated)'}</label>
                    <input id="cp-leaders" bind:value={leaderIds} placeholder={data.user.id} />
                    <label for="cp-desc">{'Description'}</label>
                    <Editor {language} bind:value={markdown} />
                    <button
                      class="btn"
                      disabled={busy || !title.trim()}
                      onclick={() => action(create)}
                      style="margin-top: 12px;"
                    >
                      {'Create project'}
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
