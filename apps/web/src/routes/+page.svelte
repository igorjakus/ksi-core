<script lang="ts">
  import {
    ArrowDown,
    ArrowRight,
    ArrowUpRight,
    Bot,
    ChevronDown,
    ChevronUp,
    CodeXml,
    FlaskConical,
    GraduationCap,
    Share2
  } from '@lucide/svelte';
</script>

<main class="flex w-full flex-col">
  <section
    class="bg-base-200 noise noise-lg relative flex min-h-[80vh] w-full justify-between overflow-hidden not-md:flex-col"
  >
    <div class="pointer-events-none absolute inset-0 hidden md:block">
      <div class="border-muted absolute top-0 left-8 h-full border border-dashed"></div>
      <div class="border-muted absolute top-0 right-8 h-full border border-dashed"></div>
    </div>
    <img
      src="http://localhost:5173/members/0.webp"
      class="pointer-events-none absolute right-16 bottom-8 hidden w-lg opacity-20 grayscale-50 md:block xl:hidden"
      alt=""
    />

    <div class="flex px-6 py-12 md:mx-8 md:px-14 md:py-20 lg:px-16 lg:py-24">
      <div class="z-1 flex flex-1 flex-col justify-between gap-4">
        <h1
          class="3xl:text-9xl mb-20 text-6xl font-extrabold tracking-tight text-balance sm:text-7xl lg:text-8xl"
        >
          Hello, World!<br />
          We're
          <span class="text-highlight md:ml-8">KSI</span>
        </h1>
        <img
          src="http://localhost:5173/members/0.webp"
          class="pointer-events-none opacity-80 md:hidden"
          alt=""
        />
        <div class="flex max-w-xl flex-col gap-4">
          <p class="3xl:text-4xl text-xl md:text-2xl 2xl:text-3xl">
            A student community exploring computer science through research, education, and events
            at the University of Wrocław.
          </p>
          <div class="flex flex-wrap gap-3">
            <a href="#projects" class="btn btn-primary btn-clipped gap-2 px-6">
              See what we do
              <ArrowDown class="size-3 -translate-y-px" />
            </a>
            <a href="#about" class="btn btn-soft btn-clipped border-0 px-6">
              About KSI <ArrowRight class="size-3 -translate-y-px " /></a
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
  <hr class="border-muted border-px mt-0 mb-1" />
  <hr class="border-muted/80 border-px my-0.5" />
  <hr class="border-muted/60 border-px my-0.5" />
  <hr class="border-muted/40 border-px my-0.5" />
  <hr class="border-muted/20 border-px my-0.5" />
  <section class="noise dark text-base-100 relative flex flex-col items-center">
    <div
      class="bg-primary noise text-base-content relative flex h-full w-full flex-col items-center py-10 lg:py-14 xl:py-20"
    >
      <div class="text-secondary pointer-events-none absolute inset-0 hidden md:block">
        <div class="border-muted/50 absolute top-0 left-8 h-full border"></div>
        <div class="border-muted/50 border-px absolute top-0 right-8 h-full border"></div>
        <div class="bg-base-content/25 absolute top-0 left-0 h-full w-8"></div>
        <div class="bg-base-content/25 absolute top-0 right-0 h-full w-8"></div>
      </div>
      <h1 class="3xl:text-7xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
        Not just code
      </h1>
      <p
        class="3xl:text-3xl max-w-md text-center text-lg md:text-xl lg:max-w-lg 2xl:max-w-xl 2xl:text-2xl"
      >
        From a kid's first line of code to a published paper — here's where our time actually goes.
      </p>
    </div>

    <div class="bg-neutral noise relative flex h-full w-full flex-col py-10 lg:py-14 xl:py-20">
      <div class="text-secondary pointer-events-none absolute inset-0 hidden md:block">
        <div class="border-muted/50 absolute top-0 left-8 h-full border"></div>
        <div class="border-muted/50 border-px absolute top-0 right-8 h-full border"></div>
        <div class="bg-base-content/25 absolute top-0 left-0 h-full w-8"></div>
        <div class="bg-base-content/25 absolute top-0 right-0 h-full w-8"></div>
      </div>

      <p class="text-secondary mb-4 self-center font-mono text-sm font-light">( socially )</p>
      <div class="flex flex-col items-center gap-16 px-4 md:px-16">
        <h1>Connecting the community</h1>
        <div
          class="mt-4 mb-16 grid max-w-lg grid-cols-1 items-center justify-between gap-8 self-center px-4 py-4 md:grid-cols-3 md:gap-8 md:px-8 lg:max-w-4xl"
        >
          <div class="flex h-full flex-col items-center gap-4">
            <h1 class="text-primary my-0">500+</h1>
            <h3 class="text-center text-balance">Children taught programming</h3>
          </div>
          <div class="flex h-full flex-col items-center gap-4">
            <h1 class="text-primary my-0">25+</h1>
            <h3 class="text-center text-balance">Conferences organized</h3>
          </div>
          <div class="flex h-full flex-col items-center gap-4">
            <h1 class="text-primary my-0">20+</h1>
            <h3 class="text-center text-balance">On-site lectures hosted</h3>
          </div>
        </div>
        <div class="space-y-32">
          <div class="grid w-full grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-8 lg:px-32">
            <div class="text-md basis-2 space-y-4">
              <h2>ZOSIA</h2>
              <p>
                Our experienced team has been organizing the well-recognized conference in the
                mountainous regions of Lower Silesia in southwestern Poland.
              </p>
              <b>The name</b>
              <p>
                It's an acronym for <i>Winter Camp of Computer Science Students</i> written in polish.
              </p>
              <b>Not just a conference – a camp</b>
              <div class="relative h-max">
                <div class="space-y-4 mask-b-from-0">
                  <p>
                    While our speakers give various talks, sharing their knowledge, scientific
                    research, hobbies and so on, we love to spend some time together in the free
                    time.
                  </p>
                  <p>
                    We pick the location for the camp diligently, to provide many attractions such
                    as billiard table, a swimming pool, air hockey and more! We no-risk guarantee
                    that you'll have fun here!
                  </p>
                </div>
                <div
                  class="absolute bottom-0 z-1 flex w-full translate-y-8 flex-col items-center self-center"
                >
                  <p>Interested?</p>
                  <a class="underline" href="/projects/zosia">read more here</a>
                </div>
              </div>
            </div>
            <img
              class="border-secondary/20 basis-1 rounded-md border-4"
              src="https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/zosia-2026/01.webp"
              alt="Group of around 20 conference attendees on a mountain viewpoint."
            />
          </div>
          <div class="grid w-full grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-8 lg:px-32">
            <img
              class="border-secondary/20 basis-1 rounded-md border-4"
              src="https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/project-hoc-past/8.webp"
              alt="Lecture room full of primary school students attending Python lecture."
            />
            <div class="text-md basis-2 space-y-4">
              <h2>Hour of Code</h2>
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
              <div class="relative h-max">
                <div class="space-y-4 mask-b-from-0">
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
                </div>
                <div
                  class="absolute bottom-0 z-1 flex w-full translate-y-8 flex-col items-center self-center"
                >
                  <p>Interested?</p>
                  <a class="underline" href="/projects/zosia">read more here</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="noise bg-primary-background relative flex h-full w-full flex-col items-center pt-10 lg:pt-14 xl:pt-20"
    >
      <div class="text-secondary pointer-events-none absolute inset-0 hidden md:block">
        <div class="border-muted/50 absolute top-0 left-8 h-full border"></div>
        <div class="border-muted/50 border-px absolute top-0 right-8 h-full border"></div>
        <div class="bg-base-content/25 absolute top-0 left-0 h-full w-8"></div>
        <div class="bg-base-content/25 absolute top-0 right-0 h-full w-8"></div>
      </div>

      <p class="text-secondary mb-4 self-center font-mono text-sm font-light">( technically )</p>
      <div class="flex flex-col gap-4 px-4 md:px-16">
        <h1>Engineering in practice</h1>
      </div>

      <div class="relative mt-10 w-full md:px-8 lg:mt-14 xl:mt-20">
        <hr class="border-secondary border-px absolute top-0 left-0 z-2 my-0 w-full" />
        <hr class="border-secondary/80 border-px my-1 w-full" />
        <hr class="border-secondary/60 border-px my-1 w-full" />
        <hr class="border-secondary/40 border-px my-1 w-full" />
        <hr class="border-secondary/20 border-px my-1 w-full" />
      </div>
    </div>
  </section>
</main>
