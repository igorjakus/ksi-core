<script lang="ts">
  import {
    ChevronDown,
    CodeXml,
    FlaskConical,
    Github,
    LogIn,
    LogOut,
    Menu,
    Mountain,
    MountainSnow,
    Share2
  } from '@lucide/svelte';
  import { sidebarStore } from '$lib/sidebar';
  import { authClient } from '$lib/auth-client';
  import { getUrls } from 'shared';
  import type { User, Session } from '@ksi-core/server/lib/auth.types';
  import { toast } from 'svelte-sonner';
  import { afterNavigate, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { MediaQuery } from 'svelte/reactivity';
  import { tick } from 'svelte';
  import Alert from './Alert.svelte';
  import LocaleSwitcher from './ui/LocaleSwitcher.svelte';
  import NavMenuPanel from './ui/NavMenuPanel.svelte';
  import type { api } from '$lib/backend';

  interface Props {
    alert: NonNullable<Awaited<ReturnType<typeof api.alerts.current.get>>['data']>;
    user: User | null;
    session: Session | null;
  }

  const { alert, user, session }: Props = $props();

  let openMenu = $state<'projects' | 'groups' | null>(null);

  let displayedMenu = $state<'projects' | 'groups'>('projects');
  let header: HTMLElement;
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');
  const desktop = new MediaQuery('(min-width: 64rem)');

  function toggleMenu(menu: 'projects' | 'groups') {
    displayedMenu = menu;
    openMenu = openMenu === menu ? null : menu;
  }

  async function handleTriggerKey(event: KeyboardEvent, menu: 'projects' | 'groups') {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    displayedMenu = menu;
    openMenu = menu;
    await tick();
    header.querySelector<HTMLAnchorElement>('#navbar-menu a')?.focus();
  }

  $effect(() => {
    if (!desktop.current) closeMenu();
  });

  function closeMenu() {
    openMenu = null;
  }

  afterNavigate(closeMenu);

  const projectItems = [
    {
      title: 'ZOSIA',
      description: 'Our winter camp for computer science students in Lower Silesia.',
      href: '/projects/zosia',
      icon: MountainSnow
    },
    {
      title: 'LEOSIA',
      description: "ZOSIA's summer counterpart — in the works.",
      href: '/projects',
      icon: Mountain,
      badge: 'Soon'
    },
    {
      title: 'ksi-core',
      description: 'This very website — open source and built by our members.',
      href: 'https://github.com/ksiuwr/ksi-core',
      icon: Github,
      external: true
    }
  ];

  const groupItems = [
    {
      title: 'Social',
      description: 'Community events, camps, and meetups that bring students together.',
      href: '/#social',
      icon: Share2
    },
    {
      title: 'Technical',
      description: 'Hands-on engineering — building tools, products, and side projects.',
      href: '/#technical',
      icon: CodeXml
    },
    {
      title: 'Scientific research',
      description: 'Reading groups and early-stage research, mentored by faculty.',
      href: '/#scientific',
      icon: FlaskConical
    }
  ];
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape' && openMenu) {
      const trigger = header.querySelector<HTMLButtonElement>(
        `[aria-controls="navbar-menu"][aria-expanded="true"]`
      );
      closeMenu();
      trigger?.focus();
    }
  }}
/>

{#if alert}
  <div class="w-full">
    <Alert {alert} />
  </div>
{/if}

<header
  id="navbar"
  bind:this={header}
  onfocusout={(event) => {
    if (event.relatedTarget instanceof Node && !header.contains(event.relatedTarget)) closeMenu();
  }}
  class="border-muted bg-base-200 fixed top-0 z-40 flex w-full flex-col border-b border-dashed backdrop-blur-sm"
>
  <div class="flex h-14 w-full shrink-0 flex-row items-center justify-between lg:px-8">
    <div class="flex h-full items-center">
      <button
        onclick={() => {
          $sidebarStore = !$sidebarStore;
        }}
        class="btn btn-square btn-ghost border-base-200 h-18 w-18 rounded-none border-y-0 border-r border-l-0 lg:hidden"
        aria-label={'Toggle sidebar'}
      >
        <div class="relative size-5">
          <span
            class="absolute inset-0 flex items-center justify-center transition-all duration-200"
          >
            <Menu class="size-5" />
          </span>
        </div>
      </button>

      <a
        href="/"
        class="hover:bg-primary hover:text-base-content flex h-full items-center gap-3 px-4 transition-colors duration-150 lg:pr-6"
      >
        <img src="/logo.svg" alt="" class="size-8 min-w-10 shrink-0" />
        <span class="font-anybody text-xl tracking-tight not-lg:hidden">KSI</span>
      </a>
    </div>
    <nav class="flex h-full items-center gap-4 not-lg:hidden">
      <button
        type="button"
        onclick={() => toggleMenu('projects')}
        onkeydown={(event) => handleTriggerKey(event, 'projects')}
        aria-controls="navbar-menu"
        aria-expanded={openMenu === 'projects'}
        class="text-base-content/80 font-anybody hover:text-base-content border-base-200 hover:bg-primary flex items-center gap-2 px-2 py-1 text-sm transition-colors duration-150 {openMenu ===
          'projects' || $page.url.pathname.startsWith('/projects')
          ? 'text-primary-content bg-primary hover:bg-primary/95'
          : ''}"
      >
        Projects
        <ChevronDown
          class="size-4 shrink-0 -translate-y-px transition-transform duration-300 {openMenu ===
          'projects'
            ? 'rotate-180'
            : ''}"
        />
      </button>
      <button
        type="button"
        onclick={() => toggleMenu('groups')}
        onkeydown={(event) => handleTriggerKey(event, 'groups')}
        aria-controls="navbar-menu"
        aria-expanded={openMenu === 'groups'}
        class="text-base-content/80 font-anybody hover:text-base-content border-base-200 hover:bg-primary flex items-center gap-2 px-2 py-1 text-sm transition-colors duration-150 {openMenu ===
          'groups' || $page.url.pathname.startsWith('/groups')
          ? 'text-primary-content bg-primary hover:bg-primary/95'
          : ''}"
      >
        Groups
        <ChevronDown
          class="size-4 shrink-0 -translate-y-px transition-transform duration-300 {openMenu ===
          'groups'
            ? 'rotate-180'
            : ''}"
        />
      </button>
      {#if session && user}
        <a
          href="/dashboard"
          class="text-base-content font-anybody hover:text-base-content border-base-200 hover:bg-base-200/40 flex h-full items-center border-r px-5 text-sm transition-colors duration-150 {$page.url.pathname.startsWith(
            '/dashboard'
          )
            ? 'text-base-content bg-base-200/30'
            : ''}"
        >
          Dashboard
        </a>
      {/if}
    </nav>

    <div class="flex h-full items-center gap-2 pr-6">
      <LocaleSwitcher class="border-base-200 border-x" />
      {#if session && user}
        <div class="border-base-200 flex h-full gap-4 border-r px-2">
          <a
            href="/dashboard"
            class="text-muted hover:text-base-content flex items-center gap-4 text-sm"
          >
            {#if user.image}
              <img
                src={user.image}
                class="size-6 rounded-full"
                alt={`${user.name}'s profile picture`}
              />
            {/if}
            {user.name}
          </a>
          <button
            class="btn btn-square btn-sm btn-outline text-error"
            onclick={async () => {
              const r = await authClient.signOut();
              if (r.data?.success) {
                toast.success('Logged out');
                await invalidateAll();
              }
            }}
          >
            <LogOut class="size-4 shrink-0" />
          </button>
        </div>
      {:else}
        <button
          onclick={() => {
            authClient.signIn
              .social({
                provider: 'discord',
                callbackURL: getUrls().frontend.landing + '/dashboard'
              })
              .catch((error) => {
                if (error instanceof Error) {
                  if (/(fetch|network|load failed)/i.test(error.message))
                    toast.error('Network error when trying to sign in');
                  else toast.error(`Unknown error occurred (${error.message})`);
                } else {
                  toast.error('Unknown error occurred');
                }
              });
          }}
          class="btn btn-primary btn-clipped gap-3"
        >
          <LogIn class="size-3 shrink-0" />
          Sign in
        </button>
      {/if}
    </div>
  </div>

  <div
    id="navbar-menu"
    class="menu-reveal"
    class:menu-open={openMenu !== null}
    inert={openMenu === null}
  >
    <div class="menu-clip">
      <div class="bg-base-200 border-muted border-b border-dashed">
        {#if displayedMenu === 'projects'}
          <NavMenuPanel
            items={projectItems}
            columns={4}
            moreHref="/projects"
            moreLabel="See more projects"
            onNavigate={closeMenu}
          />
        {:else}
          <NavMenuPanel items={groupItems} columns={3} onNavigate={closeMenu} />
        {/if}
      </div>
    </div>
  </div>
</header>

{#if openMenu}
  <div
    transition:fade={{ duration: reducedMotion.current ? 0 : 240, easing: cubicOut }}
    role="presentation"
    class="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
    onclick={closeMenu}
  ></div>
{/if}

<style>
  .menu-reveal {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    visibility: hidden;
    transition:
      grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 220ms ease,
      visibility 320ms;
  }

  .menu-reveal.menu-open {
    grid-template-rows: 1fr;
    opacity: 1;
    visibility: visible;
  }

  .menu-clip {
    min-height: 0;
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .menu-reveal,
    header :global(svg) {
      transition: none;
    }
  }
</style>
