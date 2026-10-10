<script lang="ts">
  import { ArrowDown, ArrowRight, Lightbulb, Microscope, Presentation } from '@lucide/svelte';
  import GuideFrame from '../components/ui/GuideFrame.svelte';
  import PageSection from '../components/ui/PageSection.svelte';
  import FadeDivider from '../components/ui/FadeDivider.svelte';
  import SectionEyebrow from '../components/ui/SectionEyebrow.svelte';
  import StatCard from '../components/ui/StatCard.svelte';
  import StoryBlock from '../components/ui/StoryBlock.svelte';
  import GithubProjectCard from '../components/ui/GithubProjectCard.svelte';
  
  let { data } = $props<{ data: import('./$types').PageData }>();
</script>

<main class="flex w-full flex-col">
  <section
    class="bg-base-200 noise noise-lg relative flex min-h-[80vh] w-full justify-between overflow-hidden not-md:flex-col"
  >
    <GuideFrame tone="hero" />
    <img
      src="/members/0.webp"
      class="pointer-events-none absolute right-16 bottom-8 hidden w-lg opacity-20 grayscale-50 md:block xl:hidden"
      alt=""
    />

    <div class="page-gutter-hero page-stack-hero flex">
      <div class="z-1 flex flex-1 flex-col justify-between gap-4">
        <h1
          class="3xl:text-9xl mb-20 text-6xl font-extrabold tracking-tight text-balance sm:text-7xl lg:text-8xl"
        >
          Hello, World!<br />
          We're
          <span class="text-highlight md:ml-8">KSI</span>
        </h1>
        <img src="/members/0.webp" class="pointer-events-none opacity-80 md:hidden" alt="" />
        <div class="flex max-w-xl flex-col gap-4">
          <p class="3xl:text-4xl text-xl md:text-2xl 2xl:text-3xl">
            A student community exploring computer science through research, education, and events
            at the University of Wrocław.
          </p>
          <div class="flex flex-wrap gap-3">
            <a href="#projects" class="group btn btn-primary gap-2 px-6">
              See what we do
              <ArrowDown
                class="size-3 -translate-y-px transition-transform group-hover:translate-y-0.5"
              />
            </a>
            <a href="#about" class="group btn btn-soft border-0 px-6">
              About KSI <ArrowRight
                class="size-3 -translate-y-px transition-transform group-hover:translate-x-0.5"
              /></a
            >
          </div>
        </div>
      </div>
      <div class="z-1 hidden flex-1 flex-col opacity-80 xl:flex">
        <img
          src="/members/0.webp"
          class="skew h-full object-cover grayscale-80 transition-all hover:grayscale-0"
          alt=""
        />
      </div>
    </div>
  </section>

  <FadeDivider tone="muted" />

  <section class="noise dark text-base-100 relative flex flex-col items-center">
    <PageSection id="about" guide="content-strong" class="bg-primary text-base-content page-stack">
      <h1 class="3xl:text-7xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
        How we spend our time
      </h1>
      <p
        class="3xl:text-3xl max-w-md text-center text-lg md:text-xl lg:max-w-lg 2xl:max-w-xl 2xl:text-2xl"
      >
        Three threads run through everything we do — the people we meet, the things we build, and
        the questions we chase. Here's a closer look at each.
      </p>
    </PageSection>

    <PageSection guide="content-soft" class="bg-neutral page-stack">
      <SectionEyebrow>( socially )</SectionEyebrow>
      <div class="page-gutter flex flex-col items-center gap-16">
        <h1 id="social">Connecting the community</h1>
        <div
          class="mt-4 mb-16 grid max-w-lg grid-cols-1 items-center justify-between gap-8 self-center px-4 py-4 md:grid-cols-3 md:gap-8 md:px-8 lg:max-w-4xl"
        >
          <StatCard value="500+" label="Children taught programming" />
          <StatCard value="25+" label="Conferences organized" />
          <StatCard value="20+" label="On-site lectures hosted" />
        </div>
        <div class="space-y-32">
          <StoryBlock
            title="ZOSIA"
            image={{
              src: 'https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/zosia-2026/01.webp',
              alt: 'Group of around 20 conference attendees on a mountain viewpoint.'
            }}
            readMoreHref="/projects/zosia"
          >
            {#snippet lead()}
              <p>
                Our experienced team has been organizing the well-recognized conference in the
                mountainous regions of Lower Silesia in southwestern Poland.
              </p>
              <b>The name</b>
              <p>
                It's an acronym for <i>Winter Camp of Computer Science Students</i> written in polish.
              </p>
              <b>Not just a conference – a camp</b>
            {/snippet}
            {#snippet fade()}
              <p>
                While our speakers give various talks, sharing their knowledge, scientific research,
                hobbies and so on, we love to spend some time together in the free time.
              </p>
              <p>
                We pick the location for the camp diligently, to provide many attractions such as
                billiard table, a swimming pool, air hockey and more! We no-risk guarantee that
                you'll have fun here!
              </p>
            {/snippet}
          </StoryBlock>

          <StoryBlock
            title="Hour of Code"
            image={{
              src: 'https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/project-hoc-past/8.webp',
              alt: 'Lecture room full of primary school students attending Python lecture.'
            }}
            reverse
            readMoreHref="/projects/hoc"
          >
            {#snippet lead()}
              <p>
                Multiple brilliant volunteers, one goal – share the passion for Computer Science
                with the youngest.
              </p>
              <b>Initiative</b>
              <p>
                Hour of Code is a global movement focused on bringing Computer Science and coding to
                students, in a fun activities held within one hour.
              </p>
              <b>Minds</b>
            {/snippet}
            {#snippet fade()}
              <p>
                We are fortunate to have talented people, including high school educators, past
                olympiad laureates and algorithm tutors spend their precious time to brainstorm,
                debug and perfectionize simple coding problems that will serve high educational
                value while kept engaging and funny to the youth.
              </p>
              <p>
                Real computer science students volunteer to provide feedback and help whenever
                problems get too tricky.
              </p>
            {/snippet}
          </StoryBlock>
        </div>
      </div>
    </PageSection>

    <PageSection id="projects" guide="content-soft" class="bg-primary-background page-stack">
      <SectionEyebrow>( technically )</SectionEyebrow>
      <h1 id="technical" class="page-gutter">Engineering is our passion</h1>

      <div class="page-gutter mt-8 flex flex-col items-center gap-16">
        {#each data.projects as project}
          <GithubProjectCard
            repo={project.slug}
            title={project.name}
            description={project.description}
          />
        {/each}
        {#if data.projects.length === 0}
          <p class="text-neutral-content/60 text-lg">More projects coming soon.</p>
        {/if}
      </div>

      <FadeDivider tone="secondary" pinned class="mt-10 md:px-8 lg:mt-14 xl:mt-20" />
    </PageSection>

    <PageSection id="scientific" guide="content-soft" class="bg-neutral page-stack">
      <SectionEyebrow>( scientifically )</SectionEyebrow>
      <div class="page-gutter flex flex-col items-center gap-16">
        <div class="flex flex-col items-center gap-4 text-center">
          <h1>Curiosity, kept rigorous</h1>
          <p class="text-neutral-content/70 max-w-2xl text-lg md:text-xl">
            We're still early in our research journey — no published papers to point to yet — but
            the habits that lead there are already part of how we work together.
          </p>
        </div>

        <div class="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          <div class="flex flex-col items-center gap-3 text-center">
            <Microscope class="text-primary size-8" strokeWidth={1.5} />
            <h3>Reading groups</h3>
            <p class="text-neutral-content/60 text-sm leading-relaxed">
              We pick apart papers and ideas together, well outside the lecture hall.
            </p>
          </div>
          <div class="flex flex-col items-center gap-3 text-center">
            <Presentation class="text-primary size-8" strokeWidth={1.5} />
            <h3>Guest seminars</h3>
            <p class="text-neutral-content/60 text-sm leading-relaxed">
              Researchers and alumni drop by to share what they're currently working on.
            </p>
          </div>
          <div class="flex flex-col items-center gap-3 text-center">
            <Lightbulb class="text-primary size-8" strokeWidth={1.5} />
            <h3>Early-stage research</h3>
            <p class="text-neutral-content/60 text-sm leading-relaxed">
              Members pair with faculty to explore open problems, long before any of it becomes a
              paper.
            </p>
          </div>
        </div>
      </div>
    </PageSection>
  </section>
</main>
