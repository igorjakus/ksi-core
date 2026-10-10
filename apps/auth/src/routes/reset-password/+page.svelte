<script lang="ts">
  import { onMount } from 'svelte';
  import { createAuthClient } from 'better-auth/svelte';
  let password = $state(''),
    message = $state(''),
    busy = $state(false),
    token = '';
  let client: ReturnType<typeof createAuthClient>;
  onMount(() => {
    client = createAuthClient({ baseURL: location.origin, basePath: '/api/auth' });
    token = new URL(location.href).searchParams.get('token') ?? '';
  });
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    busy = true;
    try {
      const result = await client.resetPassword({ newPassword: password, token });
      message =
        result.error?.message ?? 'Hasło zmienione. Możesz się zalogować. / Password changed.';
    } catch {
      message = 'Serwer niedostępny / Server unavailable';
    } finally {
      busy = false;
    }
  }
</script>

<main class="auth-shell">
  <section class="card auth-card">
    <h1>Nowe hasło / New password</h1>
    <form onsubmit={submit}>
      <label for="password">Hasło / Password</label><input
        id="password"
        type="password"
        autocomplete="new-password"
        minlength="8"
        required
        bind:value={password}
      /><button disabled={busy}>Zapisz / Save</button>
    </form>
    <p role="status">{message}</p>
    <a href="/">Logowanie / Sign in</a>
  </section>
</main>
