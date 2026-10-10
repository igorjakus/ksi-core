<script lang="ts">
  import { tick } from 'svelte';
  import { Plus, X, Trash2, Pencil, Save, MessagesSquare, GripVertical } from '@lucide/svelte';
  import Dropdown from '@ksi-core/ui/platform/Dropdown.svelte';
  import Editor from '@ksi-core/ui/platform/Editor.svelte';
  import MarkdownContent from '@ksi-core/ui/platform/MarkdownContent.svelte';
  export type BoardStatus = { id: string; name: string };
  export type Item = {
    id: string;
    title: string;
    markdown: string;
    column: string;
    version: number;
    position: number;
    tags: string[];
    deletedAt?: string;
  };
  type Comment = { id: string; markdown: string; createdAt: string; authorName?: string };
  let {
    items,
    statuses,
    boardId,
    projectId,
    language,
    canManage = false,
    refresh,
    reportError
  }: {
    items: Item[];
    statuses: BoardStatus[];
    boardId: string;
    projectId: string;
    language: 'pl' | 'en';
    canManage?: boolean;
    refresh: () => Promise<void>;
    reportError: (error: string) => void;
  } = $props();
  const text = (pl: string, en: string) => (language === 'pl' ? pl : en);
  const label = (s: BoardStatus) =>
    s.id === 'todo'
      ? text('Do zrobienia', 'To do')
      : s.id === 'progress'
        ? text('W trakcie', 'In progress')
        : s.id === 'done'
          ? text('Gotowe', 'Done')
          : s.name;
  const options = $derived(statuses.map((s) => ({ value: s.id, label: label(s) })));
  let busy = $state(false),
    dragged = $state<string | null>(null),
    over = $state<string | null>(null);
  let composer = $state<string | null>(null),
    title = $state(''),
    markdown = $state(''),
    statusName = $state(''),
    addingStatus = $state(false);
  let selected = $state<Item | null>(null),
    editing = $state(false),
    editTitle = $state(''),
    editMarkdown = $state(''),
    reply = $state('');
  let comments = $state<Comment[]>([]),
    commentsLoading = $state(false),
    dialog = $state<HTMLDialogElement>();
  let lastTrigger: HTMLElement | null = null,
    detailGeneration = 0;
  async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.code ?? result.message ?? text('Operacja nie powiodła się.', 'Request failed.')
      );
    return result;
  }
  async function run(work: () => Promise<void>) {
    busy = true;
    reportError('');
    try {
      await work();
      await refresh();
    } catch (error) {
      reportError(error instanceof Error ? error.message : 'Request failed');
    } finally {
      busy = false;
    }
  }
  async function ensureBoard() {
    if (boardId) return boardId;
    return (await api<{ id: string }>('/platform/boards', 'POST', projectId ? { projectId } : {}))
      .id;
  }
  async function openComposer(column: string) {
    composer = column;
    title = '';
    markdown = '';
    await tick();
    document.getElementById('task-title')?.focus();
  }
  async function create() {
    await run(async () => {
      const id = await ensureBoard();
      await api(`/platform/boards/${id}/items`, 'POST', {
        title,
        markdown,
        tags: [],
        column: composer,
        position:
          Math.max(-1, ...items.filter((i) => i.column === composer).map((i) => i.position)) + 1
      });
      composer = null;
    });
  }
  async function move(item: Item, column: string) {
    if (item.column === column || busy) return;
    await run(async () => {
      const updated = await api<Item>(`/platform/items/${item.id}`, 'PATCH', {
        version: item.version,
        column,
        position:
          Math.max(-1, ...items.filter((i) => i.column === column).map((i) => i.position)) + 1
      });
      if (selected?.id === updated.id) selected = updated;
    });
  }
  async function addStatus() {
    await run(async () => {
      const id = await ensureBoard();
      await api(`/platform/boards/${id}/statuses`, 'PUT', {
        statuses: [
          ...statuses,
          { id: `s-${crypto.randomUUID().slice(0, 8)}`, name: statusName.trim() }
        ]
      });
      statusName = '';
      addingStatus = false;
    });
  }
  async function loadComments(id: string) {
    const generation = ++detailGeneration;
    commentsLoading = true;
    try {
      const result = await api<Comment[]>(`/platform/items/${id}/comments`);
      if (generation === detailGeneration) comments = result;
    } catch (error) {
      if (generation === detailGeneration)
        reportError(error instanceof Error ? error.message : 'Request failed');
    } finally {
      if (generation === detailGeneration) commentsLoading = false;
    }
  }
  async function openItem(item: Item, event: MouseEvent) {
    lastTrigger = event.currentTarget as HTMLElement;
    selected = { ...item };
    editing = false;
    reply = '';
    comments = [];
    await tick();
    dialog?.showModal();
    void loadComments(item.id);
  }
  function closeItem() {
    detailGeneration++;
    dialog?.close();
    selected = null;
    lastTrigger?.focus();
  }
  async function saveItem() {
    if (!selected) return;
    await run(async () => {
      selected = await api<Item>(`/platform/items/${selected!.id}`, 'PATCH', {
        version: selected!.version,
        title: editTitle,
        markdown: editMarkdown
      });
      editing = false;
    });
  }
  async function removeItem() {
    if (!selected) return;
    await run(async () => {
      await api(`/platform/items/${selected!.id}`, 'DELETE', { version: selected!.version });
      closeItem();
    });
  }
  async function postReply() {
    if (!selected) return;
    await run(async () => {
      await api(`/platform/items/${selected!.id}/comments`, 'POST', { markdown: reply });
      reply = '';
      await loadComments(selected!.id);
    });
  }
</script>

<div class="board" style:grid-template-columns={`repeat(${statuses.length}, minmax(260px, 1fr))`}>
  {#each statuses as status (status.id)}
    <section
      class="board-column"
      class:drop-target={over === status.id}
      aria-label={label(status)}
      ondragover={(event) => {
        if (dragged) {
          event.preventDefault();
          over = status.id;
          if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        }
      }}
      ondragleave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) over = null;
      }}
      ondrop={(event) => {
        event.preventDefault();
        const item = items.find((i) => i.id === dragged);
        dragged = null;
        over = null;
        if (item) void move(item, status.id);
      }}
    >
      <div class="column-header">
        <span class="column-label"
          ><span class={`column-dot ${status.id}`}></span>{label(status)}<span class="column-count"
            >{items.filter((i) => i.column === status.id).length}</span
          ></span
        >
        <button
          id={`add-${status.id}`}
          type="button"
          class="icon-button"
          aria-label={`${text('Dodaj zadanie do', 'Add task to')} ${label(status)}`}
          disabled={busy}
          onclick={() => openComposer(status.id)}><Plus size={17} /></button
        >
      </div>
      <div class="column-items">
        {#each items
          .filter((i) => i.column === status.id)
          .sort((a, b) => a.position - b.position) as item (item.id)}
          <button
            type="button"
            class="kanban-card task-card"
            class:dragging={dragged === item.id}
            draggable={!busy}
            disabled={busy}
            ondragstart={(event) => {
              dragged = item.id;
              if (event.dataTransfer) {
                event.dataTransfer.setData('text/plain', item.id);
                event.dataTransfer.effectAllowed = 'move';
              }
            }}
            ondragend={() => {
              dragged = null;
              over = null;
            }}
            onclick={(event) => openItem(item, event)}
          >
            <span class="task-title"
              ><strong>{item.title}</strong><GripVertical size={14} aria-hidden="true" /></span
            >
            {#if item.markdown}<span class="task-excerpt"
                >{item.markdown.replace(/[#*_`]/g, '').slice(0, 100)}</span
              >{/if}
            {#if item.tags.length}<span class="task-tags"
                >{#each item.tags as tag}<span class="tag">{tag}</span>{/each}</span
              >{/if}
          </button>
        {/each}
      </div>
      {#if composer === status.id}<form
          class="column-composer"
          onsubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <label for="task-title" class="sr-only">{text('Tytuł zadania', 'Task title')}</label
          ><input
            id="task-title"
            bind:value={title}
            placeholder={text('Co trzeba zrobić?', 'What needs to be done?')}
            required
            maxlength="200"
          />
          <Editor {language} bind:value={markdown} rows={5} />
          <div class="composer-actions">
            <button class="btn" disabled={busy || !title.trim()}
              ><Plus size={15} />{text('Dodaj zadanie', 'Add task')}</button
            ><button
              type="button"
              class="icon-button"
              aria-label={text('Anuluj', 'Cancel')}
              disabled={busy}
              onclick={() => {
                composer = null;
                document.getElementById(`add-${status.id}`)?.focus();
              }}><X size={17} /></button
            >
          </div>
        </form>{:else}<button
          type="button"
          class="column-add"
          disabled={busy}
          onclick={() => openComposer(status.id)}
          ><Plus size={16} />{text('Dodaj zadanie', 'Add task')}</button
        >{/if}
    </section>
  {/each}
</div>
{#if canManage && statuses.length < 20}<div class="status-create">
    {#if addingStatus}<form
        class="row"
        onsubmit={(event) => {
          event.preventDefault();
          void addStatus();
        }}
      >
        <label for="status-name" class="sr-only">{text('Nazwa statusu', 'Status name')}</label
        ><input
          id="status-name"
          bind:value={statusName}
          placeholder={text('Nazwa statusu', 'Status name')}
          maxlength="60"
          required
        /><button class="btn btn-outline" disabled={busy || !statusName.trim()}
          >{text('Dodaj status', 'Add status')}</button
        ><button
          type="button"
          class="icon-button"
          aria-label={text('Anuluj', 'Cancel')}
          onclick={() => (addingStatus = false)}><X size={16} /></button
        >
      </form>
    {:else}<button
        type="button"
        class="btn btn-outline"
        disabled={busy}
        onclick={async () => {
          addingStatus = true;
          await tick();
          document.getElementById('status-name')?.focus();
        }}><Plus size={15} />{text('Dodaj status', 'Add status')}</button
      >{/if}
  </div>{/if}
{#if selected}<dialog
    bind:this={dialog}
    class="issue-dialog"
    aria-labelledby="issue-title"
    oncancel={(event) => {
      event.preventDefault();
      closeItem();
    }}
  >
    <div class="issue-heading">
      <div>
        <span class="tag">{options.find((s) => s.value === selected?.column)?.label}</span>
        <h2 id="issue-title">{selected.title}</h2>
      </div>
      <button
        type="button"
        class="icon-button"
        aria-label={text('Zamknij zadanie', 'Close task')}
        onclick={closeItem}><X size={20} /></button
      >
    </div>
    <div class="issue-tools">
      <Dropdown
        label={text('Status zadania', 'Task status')}
        value={selected.column}
        {options}
        disabled={busy}
        onselect={(column) => void move(selected!, column)}
      /><button
        type="button"
        class="btn btn-outline"
        disabled={busy}
        onclick={() => {
          editing = !editing;
          editTitle = selected!.title;
          editMarkdown = selected!.markdown;
        }}><Pencil size={14} />{text('Edytuj', 'Edit')}</button
      ><button
        type="button"
        class="btn btn-outline danger-button"
        disabled={busy}
        onclick={removeItem}><Trash2 size={14} />{text('Usuń', 'Remove')}</button
      >
    </div>
    {#if editing}<form
        class="issue-editor"
        onsubmit={(event) => {
          event.preventDefault();
          void saveItem();
        }}
      >
        <label for="issue-edit-title">{text('Tytuł', 'Title')}</label><input
          id="issue-edit-title"
          bind:value={editTitle}
          required
          maxlength="200"
        /><Editor {language} bind:value={editMarkdown} />
        <div class="row">
          <button class="btn" disabled={busy || !editTitle.trim()}
            ><Save size={14} />{text('Zapisz', 'Save')}</button
          ><button type="button" class="btn btn-outline" onclick={() => (editing = false)}
            >{text('Anuluj', 'Cancel')}</button
          >
        </div>
      </form>
    {:else}<div class="issue-description">
        <MarkdownContent value={selected.markdown} {language} />
      </div>{/if}
    <section class="issue-discussion" aria-labelledby="discussion-title">
      <h3 id="discussion-title">
        <MessagesSquare size={18} />{text('Dyskusja', 'Discussion')}<span class="muted"
          >{comments.length}</span
        >
      </h3>
      {#if commentsLoading}<div
          class="discussion-skeleton"
          aria-label={text('Ładowanie dyskusji', 'Loading discussion')}
        ></div>{:else}
        {#each comments as comment (comment.id)}<article class="discussion-post">
            <div class="post-meta">
              <strong>{comment.authorName || text('Członek koła', 'Association member')}</strong
              ><time datetime={comment.createdAt}
                >{new Date(comment.createdAt).toLocaleString(
                  language === 'pl' ? 'pl-PL' : 'en-GB'
                )}</time
              >
            </div>
            <MarkdownContent value={comment.markdown} {language} />
          </article>{/each}
        {#if !comments.length}<p class="muted">
            {text('Rozpocznij dyskusję o tym zadaniu.', 'Start a discussion about this task.')}
          </p>{/if}{/if}
      <form
        class="issue-reply"
        onsubmit={(event) => {
          event.preventDefault();
          void postReply();
        }}
      >
        <Editor {language} bind:value={reply} rows={4} /><button
          class="btn"
          disabled={busy || !reply.trim()}>{text('Dodaj odpowiedź', 'Reply')}</button
        >
      </form>
    </section>
  </dialog>{/if}

<style>
  .board {
    overflow-x: auto;
    padding: 3px 3px 12px;
  }
  .task-card {
    width: 100%;
    text-align: left;
    color: var(--ink);
    border: 1px solid var(--line);
    cursor: grab;
    display: grid;
    gap: 9px;
    margin-bottom: 10px;
  }
  .task-card:active {
    cursor: grabbing;
  }
  .task-card.dragging {
    opacity: 0.45;
  }
  .task-title {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
  }
  .task-title :global(svg) {
    color: var(--muted);
    opacity: 0;
    flex-shrink: 0;
  }
  .task-card:hover .task-title :global(svg) {
    opacity: 1;
  }
  .task-excerpt {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.6;
  }
  .task-tags {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }
  .drop-target {
    border-color: var(--accent) !important;
    outline: 1px solid var(--accent);
    outline-offset: -3px;
    background: var(--surface-muted) !important;
  }
  .status-create {
    margin-top: 20px;
  }
  .status-create input {
    max-width: 260px;
    margin: 0;
  }
  .issue-dialog {
    position: fixed;
    inset: 0;
    width: min(760px, calc(100vw - 32px));
    max-height: calc(100dvh - 48px);
    margin: auto;
    border: 1px solid var(--control-border-hover);
    border-radius: 5px;
    background: var(--surface);
    color: var(--ink);
    padding: 28px;
    overflow: auto;
  }
  .issue-dialog::backdrop {
    background: #0009;
    backdrop-filter: blur(3px);
  }
  .issue-heading {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 16px;
    margin-bottom: 20px;
  }
  .issue-heading h2 {
    font-size: 24px;
    margin-top: 10px;
    overflow-wrap: anywhere;
  }
  .issue-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .issue-tools :global(.dropdown) {
    flex: 1;
    min-width: 160px;
  }
  .issue-description {
    padding-bottom: 24px;
  }
  .issue-editor {
    display: grid;
    gap: 10px;
    margin-bottom: 24px;
  }
  .issue-discussion {
    border-top: 1px solid var(--line);
    padding-top: 24px;
  }
  .issue-discussion h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    margin-bottom: 20px;
  }
  .discussion-post {
    border-bottom: 1px solid var(--line);
    padding: 16px 0;
  }
  .post-meta {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
    font-size: 12px;
    color: var(--muted);
  }
  .post-meta time {
    font-size: 11px;
  }
  .issue-reply {
    display: grid;
    gap: 16px;
    margin-top: 24px;
  }
  .issue-reply > .btn {
    justify-self: start;
  }
  .discussion-skeleton {
    height: 80px;
    background: var(--surface-muted);
    border-radius: 3px;
  }
  @media (max-width: 760px) {
    .board {
      grid-template-columns: 1fr !important;
    }
    .issue-dialog {
      padding: 20px 16px;
      max-height: calc(100dvh - 24px);
    }
    .issue-heading h2 {
      font-size: 20px;
    }
    .post-meta {
      flex-wrap: wrap;
    }
  }
</style>
