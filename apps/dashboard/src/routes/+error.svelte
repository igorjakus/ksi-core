<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} · KSI Dashboard</title>
</svelte:head>

<div class="pending-screen">
  <div class="pending-card">
    <div class="eyebrow" style="justify-content: center; margin-bottom: 16px;">
      <span class="dot" style="background: var(--coral);"></span>
      Error {page.status}
    </div>
    <h1>{page.status === 401 || page.status === 403 ? 'Authentication Failed' : 'Error'}</h1>
    <p>
      {page.error?.message || 'An unexpected error occurred during your request.'}
    </p>
    <a href="/" class="btn" style="text-decoration: none;">Return to Dashboard</a>
  </div>
</div>
