<script lang="ts">
  import { Plus, Save, Languages, Trash2 } from '@lucide/svelte';
  import Dropdown from '@ksi-core/ui/platform/Dropdown.svelte';
  import Editor from '@ksi-core/ui/platform/Editor.svelte';
  import { contentLocales, type ContentTranslations } from 'shared/content-locales';
  let {
    kind,
    id,
    version,
    translations = {},
    baseline,
    language,
    onsaved
  }: {
    kind: 'profile' | 'project' | 'article';
    id: string;
    version?: number;
    translations?: ContentTranslations;
    baseline: Record<string, string | string[] | null>;
    language: 'pl' | 'en';
    onsaved: (result: any) => void | Promise<void>;
  } = $props();
  const labels: Record<string, string> = {
    firstName: 'First name',
    lastName: 'Last name',
    nickname: 'Nickname',
    bio: 'Biography',
    name: 'Name',
    description: 'Description',
    tags: 'Tags (comma separated)',
    title: 'Title',
    markdown: 'Article content'
  };
  let selected = $state('pl'),
    expanded = $state(false),
    draft = $state<Record<string, string>>({}),
    busy = $state(false),
    error = $state(''),
    notice = $state('');
  const locales = contentLocales
    .filter((locale) => locale !== 'en')
    .map((value) => ({ value, label: value === 'pl' ? 'Polish' : value }));
  $effect(() => {
    const fields = translations[selected as 'pl'] ?? {};
    draft = Object.fromEntries(
      Object.keys(baseline).map((key) => [
        key,
        Array.isArray(fields[key]) ? fields[key].join(', ') : ((fields[key] as string) ?? '')
      ])
    );
    expanded = Object.keys(fields).length > 0;
  });
  async function save(remove = false) {
    busy = true;
    error = '';
    notice = '';
    try {
      const fields = remove
        ? {}
        : Object.fromEntries(
            Object.entries(draft)
              .filter(([, value]) => value.trim())
              .map(([key, value]) => [
                key,
                key === 'tags'
                  ? value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                  : value
              ])
          );
      const response = await fetch(
        `/api/platform/translations/${kind}/${encodeURIComponent(id)}/${selected}`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ version, fields })
        }
      );
      const result = await response.json();
      if (!response.ok) {
        const messages: Record<string, string> = {
          ENGLISH_CONTENT_REQUIRED: 'Save the English content before adding its translation.',
          REVISION_CONFLICT: 'This content changed. Reload before saving.',
          TRANSLATED_TAG_COUNT: 'Translate every tag in the same order as the English tags.'
        };
        throw new Error(messages[result.code] ?? result.code ?? 'Request failed');
      }
      await onsaved(result);
      if (remove) {
        expanded = false;
        draft = {};
      }
      notice = 'Translations saved.';
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Request failed';
    } finally {
      busy = false;
    }
  }
</script>

<section class="card translations">
  <div class="translation-heading">
    <h2><Languages size={18} />{'Public translations'}</h2>
    <span class="tag">{'English · required'}</span>
  </div>
  <p class="muted">
    {'The main fields above are English. Add an optional translation for public visitors. Empty translated fields fall back to English; protected member names remain unchanged.'}
  </p>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if notice}<p role="status">{notice}</p>{/if}
  <div class="row">
    <Dropdown
      label={'Translation language'}
      value={selected}
      options={locales}
      onselect={(value) => (selected = value)}
      disabled={busy}
    />
    {#if !expanded}<button type="button" class="btn btn-outline" onclick={() => (expanded = true)}
        ><Plus size={15} />{'Add translation'}</button
      >{/if}
  </div>
  {#if expanded}
    <div class="translation-fields">
      {#each Object.keys(baseline) as key}
        <div class:wide={['markdown', 'bio', 'description'].includes(key)}>
          <label for={`translation-${kind}-${key}`}>{labels[key]}</label>
          <details class="source">
            <summary>{'English source'}</summary>
            <p>
              {Array.isArray(baseline[key])
                ? (baseline[key] as string[]).join(', ')
                : baseline[key] || 'No content'}
            </p>
          </details>
          {#if key === 'markdown'}<Editor {language} allowGallery bind:value={draft[key]} />
          {:else if ['description', 'bio'].includes(key)}<textarea
              id={`translation-${kind}-${key}`}
              rows="5"
              bind:value={draft[key]}
              placeholder={'Leave empty to use English'}
              maxlength={key === 'bio' ? 5000 : 10000}
            ></textarea>
          {:else}<input
              id={`translation-${kind}-${key}`}
              bind:value={draft[key]}
              placeholder={'Leave empty to use English'}
              maxlength={key === 'tags' ? 1600 : ['name', 'title'].includes(key) ? 200 : 100}
            />{/if}
        </div>
      {/each}
    </div>
    <div class="row translation-actions">
      <button type="button" class="btn" disabled={busy} onclick={() => save()}
        ><Save size={15} />{'Save translation'}</button
      ><button type="button" class="btn btn-outline" disabled={busy} onclick={() => save(true)}
        ><Trash2 size={15} />{'Remove translation'}</button
      >
    </div>
  {/if}
</section>

<style>
  .translations {
    margin-top: 20px;
  }
  .translation-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.1rem;
  }
  .translations > p {
    margin: 12px 0 16px;
    max-width: 85ch;
  }
  .translation-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  .wide {
    grid-column: 1 / -1;
  }
  .source {
    margin: 8px 0;
    color: var(--muted);
    font-size: 12px;
  }
  .source p {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    max-height: 180px;
    overflow: auto;
    padding: 10px;
    border: 1px solid var(--border);
  }
  .translation-actions {
    margin-top: 20px;
  }
  @media (max-width: 600px) {
    .translation-fields {
      grid-template-columns: 1fr;
    }
  }
</style>
