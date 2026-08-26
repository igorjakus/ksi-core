<script lang="ts">
  import { LogIn, LogOut, Menu, X } from '@lucide/svelte';
  import { sidebarStore } from '$lib/sidebar';
  import { locale, setLocale } from '$lib/locale.svelte';
  import { locales, type Locale } from '../locales/data';
  import { authClient } from '$lib/auth-client';
  import { getUrls } from 'shared';
  import type { User, Session } from '@ksi-core/server/lib/auth.types';
  import { toast } from 'svelte-sonner';
  import { afterNavigate, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import Alert from './Alert.svelte';
  import type { api } from '$lib/backend';

  interface Props {
    alert: NonNullable<Awaited<ReturnType<typeof api.alerts.current.get>>['data']>;
    user: User | null;
    session: Session | null;
  }

  const { alert, user, session }: Props = $props();

  let availableLocales = $derived(
    locales
      .map((locale) => ({
        code: locale,
        emoji: getFlagEmoji(locale),
        formattedLocale: new Intl.DisplayNames([locale], { type: 'language' }).of(locale)!
      }))
      .toSorted((a, b) => a.formattedLocale.localeCompare(b.formattedLocale))
  );
  let activeLocale = $derived(
    availableLocales.find((l) => l.code === locale.current) || availableLocales[0]
  );

  function getFlagEmoji(countryCode: string) {
    if (countryCode.includes('-')) return getFlagEmoji(countryCode.split('-')[1]);
    return [...countryCode.toUpperCase()]
      .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join('');
  }
</script>

{#if alert}
  <div class="w-full">
    <Alert {alert} />
  </div>
{/if}

<header
  id="navbar"
  class="border-b-base-200 bg-base-100/95 sticky top-0 z-40 flex h-14 w-full border-b backdrop-blur-sm lg:px-12"
>
  <div class="mx-auto flex w-full flex-row items-center justify-between lg:max-w-7xl">
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
        class="hover:bg-base-200/50 border-base-200 flex h-full items-center gap-3 border-r border-l px-4 font-mono opacity-80 transition-colors duration-150 not-md:border-r-transparent hover:opacity-100 lg:pr-6"
      >
        <img src="/logo.svg" alt="" class="size-10 min-w-10 shrink-0 dark:invert" />
        <span class="text-lg tracking-tight not-lg:hidden">KSI</span>
      </a>

      <nav class="flex h-full items-center not-lg:hidden">
        <a
          href="/"
          class="text-base-content/60 hover:text-base-content border-base-200 hover:bg-base-200/40 flex h-full items-center border-r px-5 text-sm font-medium transition-colors duration-150 {$page
            .url.pathname === '/'
            ? 'text-base-content bg-base-200/30'
            : ''}"
        >
          Home
        </a>
        <a
          href="/projects"
          class="text-base-content/60 hover:text-base-content border-base-200 hover:bg-base-200/40 flex h-full items-center border-r px-5 text-sm font-medium transition-colors duration-150 {$page.url.pathname.startsWith(
            '/projects'
          ) || $page.url.pathname.startsWith('/zosia')
            ? 'text-base-content bg-base-200/30'
            : ''}"
        >
          Projects
        </a>
        {#if session && user}
          <a
            href="/dashboard"
            class="text-base-content/60 hover:text-base-content border-base-200 hover:bg-base-200/40 flex h-full items-center border-r px-5 text-sm font-medium transition-colors duration-150 {$page.url.pathname.startsWith(
              '/dashboard'
            )
              ? 'text-base-content bg-base-200/30'
              : ''}"
          >
            Dashboard
          </a>
        {/if}
      </nav>
    </div>

    <div class="flex h-full items-center">
      <div class="dropdown border-base-200 dropdown-bottom h-full border-x">
        <div
          tabindex="0"
          role="button"
          class="text-base-content/60 hover:text-base-content border-base-200 hover:bg-base-200/40 flex h-full cursor-pointer items-center border-r px-5 text-sm font-medium transition-colors duration-150"
        >
          <span class="select-none">{activeLocale.emoji}</span>
        </div>

        <ul
          class="dropdown-content menu bg-base-200 text-base-content border-muted right-0 z-99 mt-2 w-60 border shadow"
        >
          {#each availableLocales as loc}
            <li>
              <button
                class:active={locale.current === loc.code}
                onclick={() => setLocale(loc.code)}
                class={[
                  'items-centers flex gap-2 rounded-none py-2 font-semibold uppercase',

                  locale.current === loc.code
                    ? 'text-base-content bg-blue-600'
                    : 'text-muted-100 hover:bg-base-300'
                ]}
              >
                {loc.emoji}
                {loc.formattedLocale}
              </button>
            </li>
          {/each}
        </ul>
      </div>
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
          class="btn btn-primary btn-sm"
        >
          <LogIn class="size-4 shrink-0" />
          Sign in
        </button>
      {/if}
    </div>
  </div>
</header>
