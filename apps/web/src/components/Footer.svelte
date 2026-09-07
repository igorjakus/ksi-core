<script lang="ts">
  import {
    ArrowUpRight,
    ChevronDown,
    Facebook,
    GitCommitHorizontal,
    Github,
    Instagram,
    Linkedin,
    Mail
  } from '@lucide/svelte';
  import { locale, setLocale } from '$lib/locale.svelte';
  import { locales } from '../locales/data';

  const commitHash = import.meta.env.PUBLIC_COMMIT_HASH || '';
  const shortCommitHash = commitHash.slice(0, 7);

  const availableLocales = $derived(
    locales
      .map((localeCode) => ({
        code: localeCode,
        emoji: getFlagEmoji(localeCode),
        formattedLocale: new Intl.DisplayNames([localeCode], { type: 'language' }).of(localeCode)!
      }))
      .toSorted((a, b) => a.formattedLocale.localeCompare(b.formattedLocale))
  );

  const activeLocale = $derived(
    availableLocales.find((availableLocale) => availableLocale.code === locale.current) ??
      availableLocales[0]
  );

  function getFlagEmoji(localeCode: string) {
    const countryCode = localeCode.includes('-') ? localeCode.split('-')[1] : localeCode;
    return [...countryCode.toUpperCase()]
      .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
      .join('');
  }

  // @wc-ignore
  const socialLinks = [
    { label: 'GitHub', href: 'https://github.com/ksiuwr', icon: Github },
    { label: 'Instagram', href: 'https://instagram.com/ksi_uwr', icon: Instagram },
    { label: 'Facebook', href: 'https://www.facebook.com/ksi.uwr', icon: Facebook },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/ksiuwr/', icon: Linkedin }
  ];
</script>

<footer class="bg-base-50 text-base-content relative w-full">
  <div class="pointer-events-none absolute inset-0 hidden md:block">
    <div class="border-muted absolute top-0 left-8 h-full border-l border-dashed"></div>
    <div class="border-muted absolute top-0 right-8 h-full border-l border-dashed"></div>
  </div>
  <div class="grid grid-cols-1 md:mx-8 lg:grid-cols-3">
    <div class="border-muted border-r border-dashed p-4 py-8 md:py-16">
      <a
        href="/"
        class="hover:text-primary font-anybody inline-block text-6xl font-semibold tracking-[-0.04em]"
      >
        KSI UWr
      </a>
      <p class="text-base-content/60 mt-4 max-w-sm text-sm leading-relaxed">
        Computer Science Students’ Association at the University of Wrocław.
      </p>
      <address class="text-base-content/45 mt-6 text-xs leading-relaxed not-italic">
        Institute of Computer Science<br />
        15 Fryderyka Joliot-Curie St.<br />
        50-383 Wrocław · Room 24
      </address>
    </div>

    <nav
      aria-label="Footer navigation"
      class="border-muted lg:border-base-content/15 border-t border-dashed px-4 py-8 md:py-16 lg:border-t-0 lg:border-r lg:px-10"
    >
      <p class="text-base-content/40 mb-5 text-xs font-bold tracking-[0.18em] uppercase">Explore</p>
      <ul class="space-y-3 text-sm">
        <li><a href="/#about" class="hover:text-primary transition-colors">About us</a></li>
        <li><a href="/projects" class="hover:text-primary transition-colors">Projects</a></li>
        <li>
          <a href="mailto:ksi@cs.uni.wroc.pl" class="hover:text-primary transition-colors"
            >Contact</a
          >
        </li>
      </ul>
    </nav>

    <div class="border-muted border-t border-dashed px-4 py-8 md:py-16 lg:border-t-0 lg:pl-10">
      <p class="text-base-content/40 mb-5 text-xs font-bold tracking-[0.18em] uppercase">
        Find us online
      </p>
      <div class="border-base-content/15 grid grid-cols-2 border-t border-l">
        {#each socialLinks as social (social.label)}
          <a
            href={social.href}
            target="_blank"
            rel="noreferrer"
            class="group border-base-content/15 hover:bg-base-200 hover:text-primary flex items-center justify-between gap-3 border-r border-b p-4 text-sm transition-colors"
          >
            <span class="flex items-center gap-3">
              <social.icon class="size-4" />
              {social.label}
            </span>
            <ArrowUpRight
              class="text-base-content/30 group-hover:text-primary size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        {/each}
      </div>
    </div>
  </div>

  <div
    class="border-muted text-base-100 bg-base-content flex flex-col items-center gap-3 border-t border-dashed px-4 py-3 text-xs sm:flex-row sm:justify-between md:px-12"
  >
    <span>© KSI {new Date().getFullYear()}</span>

    <div class="flex flex-wrap items-center gap-x-6 gap-y-3 not-sm:w-full">
      <div class="dropdown font-anybody dropdown-top dropdown-end not-sm:w-full">
        <button
          type="button"
          tabindex="0"
          aria-label="Change language"
          class="hover:text-primary flex items-center justify-center gap-2 transition-colors not-sm:w-full"
        >
          <span aria-hidden="true">{activeLocale.emoji}</span>
          <span
            >{activeLocale.formattedLocale.replace(/\b[a-zA-Z]/g, (char) =>
              char.toUpperCase()
            )}</span
          >
          <ChevronDown class="size-3.5 rotate-180" />
        </button>

        <ul
          tabindex="-1"
          class="dropdown-content menu border-base-content/15 bg-base-100 text-base-content z-50 mb-3 w-56 border p-2 shadow-lg not-sm:w-full"
        >
          {#each availableLocales as availableLocale (availableLocale.code)}
            <li>
              <button
                type="button"
                onclick={() => setLocale(availableLocale.code)}
                class={[
                  'flex gap-3 rounded-none py-2',
                  locale.current === availableLocale.code
                    ? 'bg-primary text-primary-content'
                    : 'hover:bg-base-200'
                ]}
              >
                <span aria-hidden="true">{availableLocale.emoji}</span>
                {availableLocale.formattedLocale.replace(/\b[a-zA-Z]/g, (char) =>
                  char.toUpperCase()
                )}
              </button>
            </li>
          {/each}
        </ul>
      </div>

      <a
        href="https://github.com/ksiuwr/ksi-core"
        target="_blank"
        rel="noreferrer"
        class="group font-anybody hover:text-primary flex w-full items-center justify-center gap-2 transition-colors sm:w-fit"
      >
        <Github class="size-3.5" />
        Source code
        <ArrowUpRight
          class="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </a>

      {#if commitHash}
        <a
          href="https://github.com/ksiuwr/ksi-core/commit/{commitHash}"
          target="_blank"
          rel="noreferrer"
          class="group hover:text-primary flex w-full items-center justify-center gap-1.5 font-mono transition-colors sm:w-fit"
          title="Commit {commitHash}"
        >
          <GitCommitHorizontal class="size-3.5" />
          <span>{shortCommitHash}</span>
        </a>
      {/if}
    </div>
  </div>
</footer>
