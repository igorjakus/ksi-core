<script lang="ts">
  let { value, label }: { value: string; label: string } = $props();
</script>

<div class="flex h-full flex-col items-center gap-4">
  <h1 class="text-primary my-0">{value}</h1>
  <h3 class="text-center text-balance">{label}</h3>
</div>
