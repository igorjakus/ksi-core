<script lang="ts">
  import { onMount } from 'svelte';
  import { createAuthClient } from 'better-auth/svelte';

  let { data } = $props();
  let language = $state<'pl' | 'en'>('pl');
  let mode = $state<'login' | 'signup' | 'reset'>('login');
  let email = $state(''),
    password = $state(''),
    name = $state(''),
    consent = $state(false),
    busy = $state(false),
    message = $state('');
  let hints = $state<{ email: string; name: string }[]>([]);
  let client: ReturnType<typeof createAuthClient>;

  const text = (pl: string, en: string) => (language === 'pl' ? pl : en);

  onMount(() => {
    client = createAuthClient({ baseURL: location.origin, basePath: '/api/auth' });
    try {
      hints = JSON.parse(localStorage.getItem('ksi-account-hints') ?? '[]');
    } catch {
      hints = [];
    }
  });

  function callback() {
    return location.search
      ? `${location.origin}/sso${location.search}`
      : `${data.dashboardOrigin}/login`;
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    message = '';
    try {
      const result =
        mode === 'signup'
          ? await client.signUp.email({ email, password, name })
          : mode === 'reset'
            ? await client.requestPasswordReset({
                email,
                redirectTo: `${location.origin}/reset-password`
              })
            : await client.signIn.email({ email, password });

      if (result.error) {
        message = result.error.message ?? text('Nie udało się zalogować.', 'Login failed.');
      } else if (mode !== 'login') {
        message = text('Sprawdź skrzynkę e-mail.', 'Check your email inbox.');
      } else {
        if (consent) {
          hints = [{ email, name: name || email }, ...hints.filter((h) => h.email !== email)].slice(
            0,
            5
          );
          localStorage.setItem('ksi-account-hints', JSON.stringify(hints));
        }
        location.assign(callback());
      }
    } catch {
      message = text('Nie można połączyć się z serwerem.', 'Server unavailable.');
    } finally {
      busy = false;
    }
  }

  async function provider(p: 'github' | 'google') {
    busy = true;
    const result = await client.signIn.social({ provider: p, callbackURL: callback() });
    if (result.error) {
      message = result.error.message ?? 'Login failed';
      busy = false;
    }
  }

  function forget(e: string) {
    hints = hints.filter((h) => h.email !== e);
    localStorage.setItem('ksi-account-hints', JSON.stringify(hints));
  }

  const modeLabel = $derived(
    mode === 'signup'
      ? text('Utwórz konto', 'Create account')
      : mode === 'reset'
        ? text('Wyślij link', 'Send recovery link')
        : text('Zaloguj się', 'Sign in')
  );

  const titleLabel = $derived(
    mode === 'signup'
      ? text('Dołącz do KSI', 'Join KSI')
      : mode === 'reset'
        ? text('Odzyskaj dostęp', 'Recover access')
        : text('Witaj w KSI', 'Welcome to KSI')
  );
</script>

<svelte:head>
  <title>{text('Logowanie', 'Sign in')} — KSI</title>
</svelte:head>

<main class="auth-shell">
  <section class="auth-card" aria-labelledby="auth-title">
    <!-- Header row -->
    <div class="auth-header">
      <strong>KSI · UWr</strong>
      <button
        type="button"
        onclick={() => (language = language === 'pl' ? 'en' : 'pl')}
        aria-label="Change language"
        style="font-family: var(--mono); font-size: 11px; border: 1px solid var(--line); background: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;"
      >
        {language === 'pl' ? 'English' : 'Polski'}
      </button>
    </div>

    <!-- Community avatars -->
    <div class="auth-community" aria-hidden="true">
      <span>AK</span><span>JN</span><span>+</span>
      <span class="auth-asterisk">✳</span>
    </div>

    <!-- eyebrow -->
    <div class="eyebrow">
      <span class="dot"></span>
      AUTH.KSI.EDU.PL
    </div>

    <h1 id="auth-title">{titleLabel}</h1>
    <p class="muted" style="margin-bottom: 20px;">
      {text(
        'Jedno konto. Wszystkie projekty i rozmowy KSI.',
        'One account. Every KSI project and conversation.'
      )}
    </p>

    <!-- Remembered account hints -->
    {#if hints.length}
      <div class="hint-list">
        {#each hints as hint (hint.email)}
          <div class="hint-item">
            <button type="button" class="hint-name" onclick={() => (email = hint.email)}>
              {hint.name}
            </button>
            <button type="button" class="hint-forget" onclick={() => forget(hint.email)}>
              {text('Zapomnij', 'Forget')}
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <!-- OAuth providers -->
    {#if mode !== 'reset'}
      <div style="margin-bottom: 4px;">
        <button type="button" class="oauth-btn" disabled={busy} onclick={() => provider('github')}>
          <span style="font-size: 16px; line-height: 1;">⌘</span>
          <span>{text('Kontynuuj z GitHub', 'Continue with GitHub')}</span>
          <span class="oauth-arrow">↗</span>
        </button>
        <button type="button" class="oauth-btn" disabled={busy} onclick={() => provider('google')}>
          <span style="font-weight: 700; font-size: 15px; line-height: 1;">G</span>
          <span>{text('Kontynuuj z Google', 'Continue with Google')}</span>
          <span class="oauth-arrow">↗</span>
        </button>
      </div>

      <div class="separator">{text('lub przez e-mail', 'or use email')}</div>
    {/if}

    <!-- Email / password form -->
    <form onsubmit={submit}>
      {#if mode === 'signup'}
        <label for="auth-name">{text('Imię i nazwisko', 'Full name')}</label>
        <input
          id="auth-name"
          type="text"
          autocomplete="name"
          bind:value={name}
          placeholder="Anna Kowalska"
          required
        />
      {/if}

      <label for="auth-email">E-mail</label>
      <input
        id="auth-email"
        type="email"
        autocomplete="email"
        bind:value={email}
        placeholder="anna@example.com"
        required
      />

      {#if mode !== 'reset'}
        <label for="auth-password">{text('Hasło', 'Password')}</label>
        <input
          id="auth-password"
          type="password"
          autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
          minlength="8"
          bind:value={password}
          placeholder="••••••••••••"
          required
        />
      {/if}

      {#if mode === 'login'}
        <label
          style="display: flex; align-items: center; gap: 8px; font-size: 12px; text-transform: none; letter-spacing: 0; color: var(--muted); margin-bottom: 16px; cursor: pointer;"
        >
          <input type="checkbox" bind:checked={consent} />
          {text('Zapamiętaj konto na tym urządzeniu', 'Remember account on this device')}
        </label>
      {/if}

      <button class="btn" type="submit" disabled={busy} style="width: 100%; margin-top: 4px;">
        {modeLabel}
        <span aria-hidden="true">{mode === 'login' ? '→' : '↗'}</span>
      </button>
    </form>

    {#if message}
      <p
        role="status"
        class={message.includes('Sprawdź') || message.includes('Check') ? 'notice' : 'error'}
        style="margin-top: 14px;"
      >
        {message}
      </p>
    {/if}

    <!-- Footer links -->
    <nav class="auth-foot" aria-label={text('Opcje konta', 'Account options')}>
      <button
        type="button"
        onclick={() => {
          mode = mode === 'signup' ? 'login' : 'signup';
          message = '';
        }}
      >
        {mode === 'signup'
          ? text('Mam już konto', 'I have an account')
          : text('Utwórz konto ↗', 'Create account ↗')}
      </button>
      <button
        type="button"
        onclick={() => {
          mode = 'reset';
          message = '';
        }}
      >
        {text('Nie pamiętam hasła', 'Forgot password')}
      </button>
    </nav>

    <p class="notice">
      {text(
        'Nowe konta wymagają aktywacji przez zarząd KSI. W sprawie dostępu skontaktuj się bezpośrednio.',
        'New accounts require activation by the KSI board. Contact us directly for access.'
      )}
    </p>
  </section>
</main>
