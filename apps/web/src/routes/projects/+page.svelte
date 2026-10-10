<script lang="ts">
  import { ArrowDown, ArrowUpRight, Search, X } from '@lucide/svelte';
  import GuideFrame from '../../components/ui/GuideFrame.svelte';
  import FadeDivider from '../../components/ui/FadeDivider.svelte';
  import ProjectPreview from '../../components/ui/ProjectPreview.svelte';

  const projects = [
    {
      title: 'Hour of Code',
      kind: 'education' as const,
      group: 'education',
      number: '02',
      category: 'Education',
      href: '/projects/hoc',
      summary:
        'Programming workshops introducing primary school students to Python and computational thinking.',
      tags: ['Python', 'Workshops', 'Community']
    },
    {
      title: 'KET',
      kind: 'quantum' as const,
      group: 'research',
      number: '03',
      category: 'Quantum computing',
      href: '/projects/ket',
      summary: 'From qubit fundamentals to algorithms running on real quantum processors.',
      tags: ['Qiskit', 'Algorithms', 'Research']
    },
    {
      title: 'Krasnal',
      kind: 'chess' as const,
      group: 'research',
      number: '04',
      category: 'Machine learning',
      href: '/projects/ml/krasnal',
      summary: 'A Transformer-based chess engine learning to produce strong, human-like moves.',
      tags: ['Transformers', 'Chess', 'AI']
    },
    {
      title: 'Physarum',
      kind: 'biology' as const,
      group: 'research',
      number: '05',
      category: 'Computational biology',
      href: '/projects/ml/physarum',
      summary:
        'Exploring whether slime mold behavior can inspire methods for training neural networks.',
      tags: ['Biology', 'Networks', 'AI']
    },
    {
      title: 'ZOSIA',
      kind: 'conference' as const,
      group: 'community',
      number: '01',
      category: 'Conference',
      href: '/projects/zosia',
      summary:
        'The annual winter camp bringing together students, researchers, and the technology community.',
      tags: ['Talks', 'Community', 'Wrocław']
    }
  ];

  // Feature the conference first, followed by education and research.
  const orderedProjects = $derived([projects[4], ...projects.slice(0, 4)]);
  const filters = [
    { value: 'all', label: 'All projects' },
    { value: 'community', label: 'Community' },
    { value: 'education', label: 'Education' },
    { value: 'research', label: 'Research' }
  ];
  let query = $state('');
  let activeFilter = $state('all');
  let filteredProjects = $derived(
    orderedProjects.filter(
      (project) =>
        (activeFilter === 'all' || project.group === activeFilter) &&
        [project.title, project.category, project.summary, ...project.tags]
          .join(' ')
          .toLowerCase()
          .includes(query.trim().toLowerCase())
    )
  );
</script>

<svelte:head>
  <title>Projects · KSI UWr</title>
  <meta
    name="description"
    content="Discover the projects built by KSI members, from student conferences and programming workshops to machine learning and quantum computing."
  />
</svelte:head>

<main class="flex w-full flex-col">
  <section class="bg-base-200 noise noise-lg relative">
    <GuideFrame tone="hero" />
    <div
      class="page-gutter page-stack-hero relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-20"
    >
      <header>
        <p class="mb-6 font-mono text-xs tracking-[0.16em] uppercase">[ Our work ]</p>
        <h1
          class="mb-8! text-4xl leading-[1.08]! tracking-tight sm:text-6xl xl:text-7xl 2xl:text-8xl"
        >
          Good ideas.<br />Real projects.<br /><span class="bg-primary text-primary-content px-3"
            >Built together.</span
          >
        </h1>
        <p class="text-base-content/65 max-w-xl text-lg leading-relaxed md:text-xl">
          From a first line of Python to a winter camp in the mountains. We turn shared curiosity
          into things worth making.
        </p>
        <a href="#project-directory" class="group btn btn-primary mt-8 gap-3 px-6">
          Explore our projects <ArrowDown
            class="size-4 transition-transform group-hover:translate-y-0.5"
          />
        </a>
      </header>

      <div class="exploration-map hidden md:block" aria-hidden="true">
        <div class="map-caption font-mono text-xs tracking-widest uppercase">
          KSI / ideas in motion
        </div>
        <svg viewBox="0 0 480 320" fill="none" class="w-full">
          <g stroke="currentColor" opacity="0.25">
            <path
              d="M0 80H480M0 160H480M0 240H480M80 0V320M160 0V320M240 0V320M320 0V320M400 0V320"
              stroke-dasharray="3 5"
            />
          </g>
          <g stroke="var(--color-base-content)" opacity="0.45" stroke-width="1.5">
            <path d="M100 84H240V160H385M100 244H240V160M240 160V45M385 160V245" />
          </g>
          <rect x="201" y="121" width="78" height="78" fill="var(--color-primary)" />
          <g fill="var(--color-base-200)" stroke="var(--color-base-content)" stroke-opacity="0.35">
            <rect x="65" y="49" width="70" height="70" /><rect
              x="65"
              y="209"
              width="70"
              height="70"
            /><rect x="350" y="125" width="70" height="70" />
          </g>
          <g
            fill="var(--color-base-content)"
            font-family="monospace"
            font-size="20"
            text-anchor="middle"
          >
            <!-- @wc-ignore -->
            <text x="100" y="92">&lt;/&gt;</text><text x="100" y="252">{'{ }'}</text><text
              x="385"
              y="168">↗</text
            ><text x="240" y="169">KSI</text>
          </g>
          <g fill="var(--color-base-content)"
            ><rect x="236" y="41" width="8" height="8" /><rect
              x="381"
              y="241"
              width="8"
              height="8"
            /></g
          >
        </svg>
        <div class="border-base-content/15 grid grid-cols-3 border-t text-center font-mono text-xs">
          <span class="py-4">Meet.</span><span class="border-base-content/15 border-x py-4"
            >Build.</span
          ><span class="py-4">Explore.</span>
        </div>
      </div>
    </div>
  </section>

  <FadeDivider />

  <section
    id="project-directory"
    class="directory noise relative scroll-mt-14"
    aria-labelledby="directory-heading"
  >
    <GuideFrame tone="content-soft" />
    <div class="page-gutter page-stack relative">
      <div class="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-primary mb-4 font-mono text-xs tracking-[0.16em] uppercase">[ Explore ]</p>
          <h2 id="directory-heading" class="mb-0! text-3xl tracking-tight md:text-5xl">
            Find your kind of curiosity.
          </h2>
        </div>
        <p class="text-base-content/60 max-w-sm text-sm leading-relaxed">
          Different fields. One community.<br />Take a closer look at what we do.
        </p>
      </div>

      <div
        class="border-base-content/20 mb-8 flex flex-col justify-between gap-6 border-y py-5 xl:flex-row xl:items-center"
      >
        <div class="flex flex-wrap gap-2" role="group" aria-label="Filter projects">
          {#each filters as filter}
            <button
              type="button"
              aria-pressed={activeFilter === filter.value}
              onclick={() => (activeFilter = filter.value)}
              class={activeFilter === filter.value ? 'active filter' : 'filter'}
              >{filter.label}</button
            >
          {/each}
        </div>
        <label class="relative block w-full xl:max-w-sm" for="project-search">
          <span class="sr-only">Search projects</span>
          <Search
            class="text-base-content/50 pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          />
          <input
            id="project-search"
            type="search"
            class="input border-base-content/20 w-full bg-transparent pl-11"
            placeholder="Search projects..."
            bind:value={query}
          />
        </label>
      </div>

      <p class="text-base-content/50 mb-5 font-mono text-xs" role="status">
        Showing {filteredProjects.length} of {projects.length} projects
      </p>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        {#each filteredProjects as project (project.href)}
          <a
            href={project.href}
            class="project-card group"
            class:featured={project.kind === 'conference'}
          >
            <div class="project-visual"><ProjectPreview kind={project.kind} /></div>
            <div class="project-copy">
              <div class="mb-6 flex items-center justify-between gap-3 font-mono text-xs">
                <span class="text-primary">[ {project.category} ]</span>
                <span class="text-base-content/35">{project.number}</span>
              </div>
              <h3 class="mb-4! text-3xl tracking-tight lg:text-4xl">{project.title}</h3>
              <p class="text-base-content/65 max-w-xl leading-relaxed">{project.summary}</p>
              <div
                class="text-base-content/45 mt-6 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs"
              >
                {#each project.tags as tag}<span>{tag}</span>{/each}
              </div>
              <div class="mt-8 flex items-center gap-3 text-sm font-medium">
                <span>Discover the project</span><ArrowUpRight
                  class="text-primary size-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </div>
            </div>
          </a>
        {:else}
          <div
            class="border-base-content/20 col-span-full border border-dashed px-6 py-20 text-center"
          >
            <h3 class="mb-3! text-2xl">No matching projects.</h3>
            <p class="text-base-content/60">Try another search or explore a different field.</p>
            <button
              class="btn btn-primary mt-6 gap-2"
              type="button"
              onclick={() => {
                query = '';
                activeFilter = 'all';
              }}><X class="size-4" />Clear filters</button
            >
          </div>
        {/each}
      </div>

      <div
        class="border-base-content/20 mt-12 flex flex-col items-start justify-between gap-6 border-t pt-10 md:flex-row md:items-center"
      >
        <div>
          <p class="text-primary mb-3 font-mono text-xs tracking-wider uppercase">
            [ What's next? ]
          </p>
          <h2 class="mb-0! text-2xl md:text-3xl">Your idea could be next.</h2>
        </div>
        <a href="mailto:ksi@cs.uni.wroc.pl" class="group btn btn-primary gap-3 px-6"
          >Let's build something <ArrowUpRight
            class="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          /></a
        >
      </div>
    </div>
  </section>
</main>

<style>
  .exploration-map {
    border: 1px solid color-mix(in oklch, var(--color-base-content) 20%, transparent);
    background-image: radial-gradient(
      color-mix(in oklch, var(--color-base-content) 15%, transparent) 1px,
      transparent 1px
    );
    background-size: 12px 12px;
  }
  .map-caption {
    padding: 1rem;
    border-bottom: 1px solid color-mix(in oklch, var(--color-base-content) 15%, transparent);
  }
  .directory {
    color-scheme: dark;
    --color-base-100: var(--color-neutral);
    --color-base-200: oklch(0.28 0.004 345.53);
    --color-base-300: oklch(0.34 0.004 345.53);
    --color-base-content: var(--color-neutral-content);
    color: var(--color-base-content);
    background: var(--color-neutral);
  }
  .filter {
    cursor: pointer;
    padding: 0.65rem 1rem;
    font-size: 0.85rem;
    border: 1px solid transparent;
    color: color-mix(in oklch, var(--color-base-content) 65%, transparent);
    transition:
      color 180ms,
      background-color 180ms;
  }
  .filter:hover {
    color: var(--color-base-content);
    background: color-mix(in oklch, var(--color-primary) 8%, transparent);
  }
  .filter.active {
    background: var(--color-primary);
    color: var(--color-primary-content);
  }
  .filter:focus-visible,
  .project-card:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 4px;
  }
  .project-card {
    display: flex;
    flex-direction: column;
    border: 1px solid color-mix(in oklch, var(--color-base-content) 18%, transparent);
    transition:
      border-color 220ms,
      background-color 220ms;
  }
  .project-card:hover {
    border-color: color-mix(in oklch, var(--color-primary) 60%, transparent);
    background: color-mix(in oklch, var(--color-primary) 4%, transparent);
  }
  .project-visual {
    height: 15rem;
    border-bottom: 1px solid color-mix(in oklch, var(--color-base-content) 15%, transparent);
  }
  .project-copy {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 1.75rem;
  }
  .project-copy > div:last-child {
    margin-top: auto;
    padding-top: 2rem;
  }
  @media (min-width: 48rem) {
    .featured {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: 1.2fr 1fr;
    }
    .featured .project-visual {
      height: 100%;
      min-height: 22rem;
      border-bottom: 0;
      border-right: 1px solid color-mix(in oklch, var(--color-base-content) 15%, transparent);
    }
    .featured .project-copy {
      padding: 2.5rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .project-card,
    .filter,
    .project-card :global(svg) {
      transition: none;
    }
  }
</style>
