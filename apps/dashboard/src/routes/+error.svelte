<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} · KSI Dashboard</title>
</svelte:head>

<div
  style="display: flex; height: 100vh; align-items: center; justify-content: center; background: var(--bg); color: var(--fg);"
>
  <div class="card" style="max-width: 400px; text-align: center; padding: 40px;">
    <div class="eyebrow" style="justify-content: center; margin-bottom: 16px;">
      <span class="dot" style="background: var(--coral);"></span>
      Error {page.status}
    </div>
    <h1 style="margin-bottom: 16px;">Authentication Failed</h1>
    <p class="muted" style="margin-bottom: 32px; line-height: 1.5;">
      {page.error?.message || 'An unexpected error occurred during your request.'}
    </p>
    <a href="/" class="btn" style="text-decoration: none;">Return to Dashboard</a>
  </div>
</div>
