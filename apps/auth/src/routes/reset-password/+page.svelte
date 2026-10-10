<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { createAuthClient } from 'better-auth/svelte';
  import { KeyRound, ArrowLeft } from '@lucide/svelte';
  import ThemeSelector from '@ksi-core/ui/platform/ThemeSelector.svelte';
  import { preferences, setLanguage } from '@ksi-core/ui/platform/preferences';
  const language = $derived(preferences.language);
  const text = (pl: string, en: string) => (language === 'pl' ? pl : en);
  let password = $state(''),
    message = $state(''),
    busy = $state(false),
    changed = $state(false);
  const token = $derived(page.url.searchParams.get('token') ?? '');
  let client: ReturnType<typeof createAuthClient>;
  onMount(() => {
    client = createAuthClient({ baseURL: location.origin, basePath: '/api/auth' });
  });
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    message = '';
    try {
      const result = await client.resetPassword({ newPassword: password, token });
      changed = !result.error;
      message =
        result.error?.message ??
        text('Hasło zmienione. Możesz się zalogować.', 'Password changed. You can sign in now.');
    } catch {
      message = text('Nie można połączyć się z serwerem.', 'Server unavailable.');
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>{text('Nowe hasło', 'New password')} — KSI</title></svelte:head>
<main class="auth-shell">
  <div class="auth-frame">
    <header class="auth-topbar">
      <a class="auth-brand" href="/">KSI<span>/ core</span></a>
      <div class="auth-preferences">
        <ThemeSelector {language} /><button
          class="btn btn-outline language-button"
          aria-label={text('Zmień język', 'Change language')}
          onclick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
          >{language === 'pl' ? 'EN' : 'PL'}</button
        >
      </div>
    </header>
    <section class="auth-card" aria-labelledby="reset-title">
      <h1 id="reset-title">{text('Nowe hasło', 'New password')}</h1>
      <p class="auth-intro">
        {text(
          'Wybierz nowe hasło do swojego konta KSI.',
          'Choose a new password for your KSI account.'
        )}
      </p>
      {#if !token}<p role="alert" class="auth-message">
          {text(
            'Brakuje linku odzyskiwania. Poproś o nowy link na stronie logowania.',
            'Recovery link missing. Request a new link on the sign-in page.'
          )}
        </p>{:else if !changed}<form class="auth-form" onsubmit={submit}>
          <div class="auth-field">
            <label for="password">{text('Hasło', 'Password')}</label><input
              id="password"
              type="password"
              autocomplete="new-password"
              minlength="8"
              required
              disabled={busy}
              bind:value={password}
            />
          </div>
          <button class="btn submit-button" disabled={busy}
            >{busy
              ? text('Zapisywanie…', 'Saving…')
              : text('Zapisz hasło', 'Save password')}</button
          >
        </form>{/if}{#if message}<p role="status" class="auth-message">{message}</p>{/if}<a
        class="btn btn-outline auth-back"
        href="/"
        ><ArrowLeft size={15} aria-hidden="true" />{text('Wróć do logowania', 'Back to sign in')}</a
      >
    </section>
    <footer class="auth-footer">
      <a href="/">{text('Wróć na stronę KSI', 'Back to KSI')}</a><span class="right-col"
        >KSI · {text('Uniwersytet Wrocławski', 'University of Wrocław')}</span
      ><span>v{import.meta.env.PUBLIC_APP_VERSION}</span><a
        class="right-col"
        href={import.meta.env.PUBLIC_COMMIT_HASH
          ? `https://github.com/ksiuwr/ksi-core/commit/${import.meta.env.PUBLIC_COMMIT_HASH}`
          : 'https://github.com/ksiuwr/ksi-core'}
        target="_blank"
        rel="noopener noreferrer"
        >{import.meta.env.PUBLIC_COMMIT_HASH?.slice(0, 7) || text('Kod źródłowy', 'Source')}</a
      >
    </footer>
  </div>
</main>
