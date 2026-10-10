<script lang="ts">
  import { ArrowRight, Microscope, Presentation, Lightbulb, ArrowUpRight } from '@lucide/svelte';
  let { data } = $props<{ data: import('./$types').PageData }>();
  const projects = [
    {
      slug: 'ksiuwr/ksi-core',
      name: 'ksi-core',
      description:
        'This website. Surrounded by many unfamiliar technologies, passionate members get to develop their engineering senses in a friendly environment.'
    },
    {
      slug: 'KSI-ML-research/krasnal',
      name: 'Krasnal',
      description: 'Chess engine built with Rust and machine learning.'
    }
  ];
  // Re-assign back to data just in case something else relies on it, though probably not needed if hardcoded.
  data.projects = projects;
</script>

<main class="bg-base-100 min-h-[calc(100vh-56px)] w-full">
  <div class="mx-auto max-w-[900px] px-5 py-[60px]">
    <!-- Hero -->
    <div class="mb-20 flex flex-wrap items-center gap-10">
      <div class="min-w-[300px] flex-1">
        <h1
          class="font-anybody text-base-content mb-5 text-[clamp(40px,8vw,64px)] leading-[1.1] font-bold tracking-tight"
        >
          Hello, World!<br />We're KSI.
        </h1>
        <p class="text-base-content/70 mb-8 max-w-[600px] text-[18px] leading-relaxed">
          A student community exploring computer science through research, education, and events at
          the University of Wrocław.
        </p>
        <div class="flex flex-wrap gap-3">
          <a href="#projects" class="btn">See what we do <ArrowRight size={16} /></a>
          <a href="#about" class="btn btn-outline">About KSI</a>
        </div>
      </div>
      <div class="flex min-w-[300px] flex-1 justify-end">
        <img
          src="/members/0.webp"
          class="border-base-content/20 max-w-full rounded border object-cover opacity-90"
          alt="KSI Members"
        />
      </div>
    </div>

    <!-- Socially -->
    <section id="about" class="mb-20">
      <div class="text-base-content/70 mb-5 font-mono text-[11px] tracking-wider uppercase">
        ( socially ) Connecting the community
      </div>
      <div class="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <div class="card border-base-content/20 bg-base-100 rounded border p-6">
          <h3 class="font-anybody text-primary m-0 mb-2 text-[32px]">500+</h3>
          <p class="text-base-content/70 m-0 text-[12px]">Children taught programming</p>
        </div>
        <div class="card border-base-content/20 bg-base-100 rounded border p-6">
          <h3 class="font-anybody text-primary m-0 mb-2 text-[32px]">25+</h3>
          <p class="text-base-content/70 m-0 text-[12px]">Conferences organized</p>
        </div>
        <div class="card border-base-content/20 bg-base-100 rounded border p-6">
          <h3 class="font-anybody text-primary m-0 mb-2 text-[32px]">20+</h3>
          <p class="text-base-content/70 m-0 text-[12px]">On-site lectures hosted</p>
        </div>
      </div>

      <div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <div
          class="card border-base-content/20 bg-base-100 flex flex-col items-stretch overflow-hidden rounded border p-0"
        >
          <img
            src="https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/zosia-2026/01.webp"
            alt="ZOSIA"
            class="border-base-content/20 h-[200px] w-full border-b object-cover"
          />
          <div class="flex flex-1 flex-col items-start p-6">
            <h3 class="font-anybody text-base-content m-0 mb-3 text-[18px]">ZOSIA</h3>
            <p class="text-base-content/70 mb-5 flex-1 text-[13px] leading-relaxed">
              Our experienced team has been organizing the well-recognized conference in the
              mountainous regions of Lower Silesia in southwestern Poland. While our speakers give
              various talks, sharing their knowledge, scientific research, hobbies and so on, we
              love to spend some time together in the free time.
            </p>
            <a href="/projects/zosia" class="btn btn-outline">Read more</a>
          </div>
        </div>

        <div
          class="card border-base-content/20 bg-base-100 flex flex-col items-stretch overflow-hidden rounded border p-0"
        >
          <img
            src="https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/project-hoc-past/8.webp"
            alt="Hour of Code"
            class="border-base-content/20 h-[200px] w-full border-b object-cover"
          />
          <div class="flex flex-1 flex-col items-start p-6">
            <h3 class="font-anybody text-base-content m-0 mb-3 text-[18px]">Hour of Code</h3>
            <p class="text-base-content/70 mb-5 flex-1 text-[13px] leading-relaxed">
              Hour of Code is a global movement focused on bringing Computer Science and coding to
              students, in fun activities held within one hour. Multiple brilliant volunteers, one
              goal – share the passion for Computer Science with the youngest.
            </p>
            <a href="/projects/hoc" class="btn btn-outline">Read more</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Technically -->
    <section id="projects" class="mb-20">
      <div class="text-base-content/70 mb-5 font-mono text-[11px] tracking-wider uppercase">
        ( technically ) Engineering is our passion
      </div>
      <div class="flex flex-col gap-8">
        {#each data.projects as project (project.slug)}
          <a
            href={`https://github.com/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            class="card group border-base-content/20 bg-base-100 hover:bg-base-200 grid grid-cols-1 overflow-hidden rounded border p-0 no-underline transition-colors md:grid-cols-2"
          >
            <div class="border-base-content/20 flex border-b md:border-r md:border-b-0">
              <img
                src={`https://opengraph.githubassets.com/1/${project.slug}`}
                alt=""
                class="block h-full min-h-50 w-full object-cover"
              />
            </div>
            <div class="bg-neutral flex flex-col justify-center gap-4 p-8 px-6">
              <div class="flex items-center justify-between">
                <span class="text-base-content/70 font-mono text-[11px] tracking-wider uppercase">
                  {project.slug}
                </span>
                <span class="text-primary flex items-center gap-1 text-[11px]">
                  View on GitHub <ArrowUpRight size={14} />
                </span>
              </div>
              <div>
                <h2 class="font-anybody text-base-content m-0 mb-3 text-[24px]">
                  {project.name}
                </h2>
                <p class="text-base-content/70 m-0 text-[14px] leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>
          </a>
        {/each}
        {#if data.projects.length === 0}
          <p class="text-base-content/70 text-[13px]">More projects coming soon.</p>
        {/if}
      </div>
    </section>

    <section id="scientific" class="mb-15">
      <div class="text-base-content/70 mb-5 font-mono text-[11px] tracking-wider uppercase">
        ( scientifically ) Curiosity, kept rigorous
      </div>
      <p class="text-base-content mb-8 max-w-[600px] text-[15px] leading-relaxed">
        We're still early in our research journey — no published papers to point to yet — but the
        habits that lead there are already part of how we work together.
      </p>
      <div class="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
        <div class="card border-base-content/20 bg-base-100 flex flex-col gap-4 rounded border p-6">
          <Microscope size={28} class="text-primary" />
          <div>
            <h3 class="font-anybody text-base-content m-0 mb-2 text-[16px]">Reading groups</h3>
            <p class="text-base-content/70 m-0 text-[13px] leading-normal">
              We pick apart papers and ideas together, well outside the lecture hall.
            </p>
          </div>
        </div>
        <div class="card border-base-content/20 bg-base-100 flex flex-col gap-4 rounded border p-6">
          <Presentation size={28} class="text-primary" />
          <div>
            <h3 class="font-anybody text-base-content m-0 mb-2 text-[16px]">Guest seminars</h3>
            <p class="text-base-content/70 m-0 text-[13px] leading-normal">
              Researchers and alumni drop by to share what they're currently working on.
            </p>
          </div>
        </div>
        <div class="card border-base-content/20 bg-base-100 flex flex-col gap-4 rounded border p-6">
          <Lightbulb size={28} class="text-primary" />
          <div>
            <h3 class="font-anybody text-base-content m-0 mb-2 text-[16px]">
              Early-stage research
            </h3>
            <p class="text-base-content/70 m-0 text-[13px] leading-normal">
              Members pair with faculty to explore open problems, long before any of it becomes a
              paper.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</main>
