<script lang="ts">
  import { onMount } from 'svelte';
  import { createAuthClient } from 'better-auth/svelte';

  let { data } = $props();
  import {Github, ArrowUpRight, ArrowRight, UserRound, KeyRound} from '@lucide/svelte';
  import ThemeSelector from '@ksi-core/ui/platform/ThemeSelector.svelte';
  import {preferences,setLanguage} from '@ksi-core/ui/platform/preferences';
  const language=$derived(preferences.language);
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
      const stored = JSON.parse(localStorage.getItem('ksi-account-hints') ?? '[]');
      hints=Array.isArray(stored)?stored.filter(h=>h && typeof h.email==='string' && typeof h.name==='string').slice(0,5):[];
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

  async function provider(p:'github'|'google') {
    busy=true;message='';
    try{const result=await client.signIn.social({provider:p,callbackURL:callback()});if(result.error){message=result.error.message??text('Nie udało się zalogować.','Login failed.');busy=false;}}catch{message=text('Nie można połączyć się z serwerem.','Server unavailable.');busy=false;}
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
 <div class="auth-frame">
  <header class="auth-topbar"><a class="auth-brand" href={data.websiteOrigin}>KSI<span>/ core</span></a><div class="auth-preferences"><ThemeSelector {language}/><button class="btn btn-outline language-button" aria-label={text('Zmień język','Change language')} onclick={()=>setLanguage(language==='pl'?'en':'pl')}>{language==='pl'?'EN':'PL'}</button></div></header>
  <section class="auth-card" aria-labelledby="auth-title">
   <div class="auth-symbol"><KeyRound size={24} strokeWidth={1.5} aria-hidden="true"/></div>
   <h1 id="auth-title">{titleLabel}</h1><p class="auth-intro">{text('Jedno konto. Wszystkie projekty i rozmowy KSI.','One account. Every KSI project and conversation.')}</p>
   {#if mode!=='reset'}<div class="auth-mode" role="group" aria-label={text('Opcje konta','Account options')}><button class:active={mode==='login'} aria-pressed={mode==='login'} disabled={busy} onclick={()=>{mode='login';message='';}}>{text('Logowanie','Sign in')}</button><button class:active={mode==='signup'} aria-pressed={mode==='signup'} disabled={busy} onclick={()=>{mode='signup';message='';}}>{text('Nowe konto','Create account')}</button></div>{/if}
   {#if hints.length && mode==='login'}<div class="hint-list"><p class="hint-label">{text('Zapamiętane konta','Remembered accounts')}</p>{#each hints as hint (hint.email)}<div class="hint-item"><button class="hint-name" disabled={busy} onclick={()=>{email=hint.email;document.getElementById('auth-password')?.focus();}}><UserRound size={17} aria-hidden="true"/><span>{hint.name}<small>{hint.email}</small></span></button><button class="hint-forget" disabled={busy} onclick={()=>forget(hint.email)} aria-label={`${text('Zapomnij konto','Forget account')}: ${hint.email}`}>{text('Zapomnij','Forget')}</button></div>{/each}</div>{/if}
   {#if mode!=='reset'}<div class="oauth-providers"><button type="button" class="btn btn-outline oauth-btn" disabled={busy} onclick={()=>provider('github')}><Github size={18} aria-hidden="true"/><span>{text('Kontynuuj z GitHub','Continue with GitHub')}</span><ArrowUpRight size={15} aria-hidden="true"/></button><button type="button" class="btn btn-outline oauth-btn" disabled={busy} onclick={()=>provider('google')}><span class="google-icon" aria-hidden="true">G</span><span>{text('Kontynuuj z Google','Continue with Google')}</span><ArrowUpRight size={15} aria-hidden="true"/></button></div><div class="separator">{text('lub przez e-mail','or use email')}</div>{/if}
   <form class="auth-form" onsubmit={submit}>
    {#if mode==='signup'}<div class="auth-field"><label for="auth-name">{text('Imię i nazwisko','Full name')}</label><input id="auth-name" autocomplete="name" bind:value={name} placeholder="Anna Kowalska" required disabled={busy}/></div>{/if}
    <div class="auth-field"><label for="auth-email">E-mail</label><input id="auth-email" type="email" autocomplete="email" bind:value={email} placeholder="anna@example.com" required disabled={busy}/></div>
    {#if mode!=='reset'}<div class="auth-field"><div class="password-label"><label for="auth-password">{text('Hasło','Password')}</label>{#if mode==='login'}<button type="button" class="text-button" disabled={busy} onclick={()=>{mode='reset';message='';}}>{text('Nie pamiętam hasła','Forgot password')}</button>{/if}</div><input id="auth-password" type="password" autocomplete={mode==='signup'?'new-password':'current-password'} minlength="8" bind:value={password} required disabled={busy}/></div>{/if}
    {#if mode==='login'}<label class="remember"><input type="checkbox" bind:checked={consent} disabled={busy}/>{text('Zapamiętaj konto na tym urządzeniu','Remember account on this device')}</label>{/if}
    <button class="btn submit-button" disabled={busy}>{busy?text('Proszę czekać…','Please wait…'):modeLabel}<ArrowRight size={16} aria-hidden="true"/></button>
   </form>
   {#if message}<p role="status" class="auth-message">{message}</p>{/if}
   {#if mode==='reset'}<button class="btn btn-outline auth-back" disabled={busy} onclick={()=>{mode='login';message='';}}>{text('Wróć do logowania','Back to sign in')}</button>{/if}
   <p class="activation-note">{text('Nowe konta wymagają aktywacji przez zarząd KSI.','New accounts require activation by the KSI board.')}</p>
  </section>
  <footer class="auth-footer"><a href={data.websiteOrigin}>{text('Wróć na stronę KSI','Back to KSI')}<ArrowUpRight size={13} aria-hidden="true"/></a><span>KSI · {text('Uniwersytet Wrocławski','University of Wrocław')}</span></footer>
 </div>
</main>
