<script lang="ts">
  import { tick, onMount } from 'svelte';
  let {
    member,
    href,
    role
  }: {
    member: {
      id: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      nickname?: string | null;
      image?: string | null;
      bio?: string | null;
    };
    href: string;
    role: string;
  } = $props();
  let anchor = $state<HTMLAnchorElement>(),
    card = $state<HTMLDivElement>();
  let open = $state(false),
    position = $state({ left: 0, top: 0, width: 280 });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const name = $derived(
    [member.firstName || member.name, member.lastName].filter(Boolean).join(' ')
  );
  function cancelClose() {
    clearTimeout(timer);
  }
  function close() {
    cancelClose();
    card?.hidePopover();
    open = false;
  }
  function place() {
    if (!anchor || !card) return;
    const rect = anchor.getBoundingClientRect(),
      width = Math.min(300, window.innerWidth - 24),
      height = card.offsetHeight;
    const below = window.innerHeight - rect.bottom - 12;
    position = {
      width,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top: below >= height ? rect.bottom + 4 : Math.max(12, rect.top - height - 4)
    };
  }
  async function show() {
    cancelClose();
    if (!card) return;
    card.showPopover();
    open = true;
    await tick();
    place();
  }
  function later() {
    cancelClose();
    timer = setTimeout(close, 120);
  }
  onMount(() => () => cancelClose());
  $effect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const scroll = (event: Event) => {
      if (!(event.target instanceof Node && card?.contains(event.target))) close();
    };
    window.addEventListener('keydown', key);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', scroll, true);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', scroll, true);
    };
  });
</script>

<div
  class="identity"
  role="group"
  aria-label={name}
  onpointerenter={() => void show()}
  onpointerleave={later}
  onfocusin={() => void show()}
  onfocusout={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
  }}
>
  <a bind:this={anchor} class="person-link" {href}>
    {#if member.image}<img src={member.image} alt="" />{:else}<span class="initials"
        >{(member.firstName || member.name)?.[0]}{member.lastName?.[0]}</span
      >{/if}
    <span class="identity-text"
      >{name}{#if member.nickname}<small>aka. {member.nickname}</small>{/if}</span
    >
  </a>
  <div
    bind:this={card}
    class="hover-card"
    popover="manual"
    style:left={`${position.left}px`}
    style:top={`${position.top}px`}
    style:width={`${position.width}px`}
    aria-hidden={!open}
  >
    <strong>{name}</strong>
    <p class="muted">{role}</p>
    {#if member.nickname}<p>aka. {member.nickname}</p>{/if}
    <p class="bio">{member.bio || 'No biography yet.'}</p>
    <a class="btn btn-outline" {href}>{'View profile'}</a>
  </div>
</div>

<style>
  .person-link {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--ink);
    text-decoration: none;
    width: fit-content;
  }
  .person-link img,
  .initials {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  .initials {
    display: grid;
    place-items: center;
    background: var(--surface-muted);
  }
  .identity-text {
    overflow-wrap: anywhere;
  }
  small {
    display: block;
    color: var(--muted);
    margin-top: 4px;
    font-size: 11px;
  }
  .hover-card {
    position: fixed;
    inset: auto;
    margin: 0;
    padding: 20px;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: 0 8px 24px #0002;
    border-radius: 4px;
    max-height: calc(100vh - 24px);
    overflow: auto;
  }
  .hover-card p {
    margin: 8px 0;
  }
  .hover-card .btn {
    margin-top: 8px;
    font-size: 12px;
    padding: 8px 12px;
  }
  .bio {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    max-height: 160px;
    overflow: auto;
    font-size: 13px;
  }
</style>
