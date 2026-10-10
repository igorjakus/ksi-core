<script lang="ts">
  import Markdown from './Markdown.svelte';
  import type { MarkdownBlock } from 'shared/markdown';
  let { value = $bindable('') } = $props<{ value?: string }>();
  let blocks = $state<MarkdownBlock[]>([]),
    message = $state(''),
    preview = $state(false),
    busy = $state(false);
  async function render() {
    const response = await fetch('/api/markdown', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ markdown: value })
    });
    if (response.ok) {
      blocks = await response.json();
      preview = true;
    } else message = 'Podgląd niedostępny / Preview unavailable';
  }
  async function upload(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    busy = true;
    try {
      const body = new FormData();
      body.set('file', file);
      const response = await fetch('/api/files', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.code ?? 'Upload failed');
      value += `\n${file.type.startsWith('image/') ? '!' : ''}[${file.name.replace(/[\[\]\\]/g, '_')}](file:${data.id})\n`;
    } catch (error) {
      message = error instanceof Error ? error.message : 'Upload failed';
    } finally {
      busy = false;
      input.value = '';
    }
  }
</script>

<div class="stack">
  <label for="markdown-editor">Markdown</label><textarea id="markdown-editor" bind:value rows="14"
  ></textarea>
  <div class="row">
    <button type="button" onclick={render}>Podgląd / Preview</button><button
      type="button"
      onclick={() => (value += '\n:::gallery preview=3\nfile:IMAGE_ID\n:::\n')}
      >Galeria / Gallery</button
    ><label>Załącznik / Attachment <input type="file" disabled={busy} onchange={upload} /></label>
  </div>
  {#if message}<p role="status" class="error">{message}</p>{/if}{#if preview}<Markdown
      {blocks}
    />{/if}
</div>
