<script lang="ts">
  import MarkdownContent from './MarkdownContent.svelte';
  import { Eye, Pencil, Images, UploadCloud, Paperclip } from '@lucide/svelte';
  let {
    value = $bindable(''),
    language = 'pl',
    rows = 10
  }: { value?: string; language?: 'pl' | 'en'; rows?: number } = $props();
  const uid = $props.id();
  const text = (pl: string, en: string) => (language === 'pl' ? pl : en);
  let message = $state(''),
    preview = $state(false),
    busy = $state(false),
    dragging = $state(false);
  let input = $state<HTMLInputElement>();
  async function upload(files: FileList | File[] | null) {
    if (!files?.length || busy) return;
    busy = true;
    message = '';
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set('file', file);
        const response = await fetch('/api/files', { method: 'POST', body });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.code ?? text('Nie udało się wysłać pliku.', 'Upload failed.'));
        value += `\n${file.type.startsWith('image/') ? '!' : ''}[${file.name.replace(/[[\]\\]/g, '_')}](file:${data.id})\n`;
      }
    } catch (error) {
      message =
        error instanceof Error ? error.message : text('Błąd przesyłania.', 'Upload failed.');
    } finally {
      busy = false;
      if (input) input.value = '';
    }
  }
</script>

<div class="editor">
  <div class="editor-toolbar">
    <div class="editor-tabs" role="group" aria-label={text('Tryb edytora', 'Editor mode')}>
      <button
        type="button"
        class:active={!preview}
        aria-pressed={!preview}
        onclick={() => (preview = false)}><Pencil size={14} />{text('Edytuj', 'Write')}</button
      >
      <button
        type="button"
        class:active={preview}
        aria-pressed={preview}
        onclick={() => (preview = true)}><Eye size={14} />{text('Podgląd', 'Preview')}</button
      >
    </div>
    <button
      type="button"
      class="gallery-button"
      onclick={() => {
        value += '\n:::gallery preview=3\nfile:IMAGE_ID\n:::\n';
        preview = false;
      }}><Images size={14} />{text('Galeria', 'Gallery')}</button
    >
  </div>
  {#if preview}<div class="editor-preview"><MarkdownContent {value} {language} /></div>
  {:else}<label for={uid} class="sr-only">Markdown</label><textarea
      id={uid}
      bind:value
      {rows}
      placeholder={text('Opis w Markdown…', 'Write a Markdown description…')}
    ></textarea>{/if}
  <input
    bind:this={input}
    class="file-input"
    type="file"
    multiple
    disabled={busy}
    onchange={(event) => upload(event.currentTarget.files)}
    tabindex="-1"
    aria-hidden="true"
  />
  <button
    type="button"
    class="upload-zone"
    class:dragging
    disabled={busy}
    onclick={() => input?.click()}
    ondragover={(event) => {
      event.preventDefault();
      dragging = true;
    }}
    ondragleave={() => (dragging = false)}
    ondrop={(event) => {
      event.preventDefault();
      dragging = false;
      void upload(event.dataTransfer?.files ?? null);
    }}
  >
    {#if busy}<UploadCloud size={18} />{text('Przesyłanie…', 'Uploading…')}{:else}<Paperclip
        size={17}
      /><span
        >{text(
          'Przeciągnij pliki lub wybierz załączniki',
          'Drop files here or choose attachments'
        )}</span
      >{/if}
  </button>
  {#if message}<p role="alert" class="error">{message}</p>{/if}
</div>

<style>
  .editor {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .editor-tabs {
    display: flex;
    gap: 2px;
  }
  .editor button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    color: var(--muted);
    padding: 7px 9px;
    font-size: 12px;
    cursor: pointer;
  }
  .editor button:hover {
    border-color: var(--control-border-hover, var(--line));
    color: var(--ink);
  }
  .editor button.active {
    background: var(--surface-muted);
    border-color: var(--line);
    color: var(--ink);
  }
  .editor textarea {
    width: 100%;
    min-height: 130px;
    margin: 0;
    resize: vertical;
  }
  .editor-preview {
    min-height: 160px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 3px;
    overflow-wrap: anywhere;
  }
  .file-input {
    display: none;
  }
  .editor .upload-zone {
    width: 100%;
    justify-content: center;
    border: 1px dashed var(--line);
    padding: 18px 12px;
    line-height: 1.5;
    text-align: center;
  }
  .editor .upload-zone:hover,
  .editor .upload-zone.dragging {
    border-color: var(--accent);
    background: var(--surface-muted);
  }
  .editor button:disabled {
    opacity: 0.5;
    cursor: wait;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
