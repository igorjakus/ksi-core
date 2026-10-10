<script lang="ts">
  import { ArrowRight, Microscope, Presentation, Lightbulb, ArrowUpRight } from '@lucide/svelte';
  let { data } = $props<{ data: import('./$types').PageData }>();
  const hardcodedProjects = [
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
</script>

<main class="w-full" style="background: var(--paper); min-height: calc(100vh - 56px);">
  <div style="max-width: 900px; margin: 0 auto; padding: 60px 20px;">
    <!-- Hero -->
    <div
      style="display: flex; gap: 40px; align-items: center; margin-bottom: 80px; flex-wrap: wrap;"
    >
      <div style="flex: 1; min-width: 300px;">
        <h1
          style="font-family: var(--display); font-size: clamp(40px, 8vw, 64px); font-weight: 700; letter-spacing: -0.05em; color: var(--ink); margin-bottom: 20px; line-height: 1.1;"
        >
          Hello, World!<br />We're KSI.
        </h1>
        <p
          style="font-size: 18px; color: var(--muted); max-width: 600px; line-height: 1.6; margin-bottom: 32px;"
        >
          A student community exploring computer science through research, education, and events at
          the University of Wrocław.
        </p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="#projects" class="btn">See what we do <ArrowRight size={16} /></a>
          <a href="#about" class="btn btn-outline">About KSI</a>
        </div>
      </div>
      <div style="flex: 1; display: flex; justify-content: flex-end; min-width: 300px;">
        <img
          src="/members/0.webp"
          style="max-width: 100%; object-fit: cover; opacity: 0.9; border: 1px solid var(--line); border-radius: 4px;"
          alt="KSI Members"
        />
      </div>
    </div>

    <!-- Socially -->
    <section id="about" style="margin-bottom: 80px;">
      <div
        style="font-family: var(--mono); font-size: 11px; color: var(--muted); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em;"
      >
        ( socially ) Connecting the community
      </div>
      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;"
      >
        <div class="card" style="padding: 24px;">
          <h3
            style="font-size: 32px; font-family: var(--display); color: var(--primary); margin: 0 0 8px 0;"
          >
            500+
          </h3>
          <p style="margin: 0; color: var(--muted); font-size: 12px;">
            Children taught programming
          </p>
        </div>
        <div class="card" style="padding: 24px;">
          <h3
            style="font-size: 32px; font-family: var(--display); color: var(--primary); margin: 0 0 8px 0;"
          >
            25+
          </h3>
          <p style="margin: 0; color: var(--muted); font-size: 12px;">Conferences organized</p>
        </div>
        <div class="card" style="padding: 24px;">
          <h3
            style="font-size: 32px; font-family: var(--display); color: var(--primary); margin: 0 0 8px 0;"
          >
            20+
          </h3>
          <p style="margin: 0; color: var(--muted); font-size: 12px;">On-site lectures hosted</p>
        </div>
      </div>

      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;"
      >
        <div
          class="card"
          style="padding: 0; display: flex; flex-direction: column; align-items: stretch; overflow: hidden;"
        >
          <img
            src="https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/zosia-2026/01.webp"
            alt="ZOSIA"
            style="width: 100%; height: 200px; object-fit: cover; border-bottom: 1px solid var(--line);"
          />
          <div
            style="padding: 24px; display: flex; flex-direction: column; align-items: flex-start; flex: 1;"
          >
            <h3
              style="margin: 0 0 12px 0; font-family: var(--display); font-size: 18px; color: var(--ink);"
            >
              ZOSIA
            </h3>
            <p
              style="color: var(--muted); font-size: 13px; line-height: 1.6; margin-bottom: 20px; flex: 1;"
            >
              Our experienced team has been organizing the well-recognized conference in the
              mountainous regions of Lower Silesia in southwestern Poland. While our speakers give
              various talks, sharing their knowledge, scientific research, hobbies and so on, we
              love to spend some time together in the free time.
            </p>
            <a href="/projects/zosia" class="btn btn-outline">Read more</a>
          </div>
        </div>

        <div
          class="card"
          style="padding: 0; display: flex; flex-direction: column; align-items: stretch; overflow: hidden;"
        >
          <img
            src="https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/project-hoc-past/8.webp"
            alt="Hour of Code"
            style="width: 100%; height: 200px; object-fit: cover; border-bottom: 1px solid var(--line);"
          />
          <div
            style="padding: 24px; display: flex; flex-direction: column; align-items: flex-start; flex: 1;"
          >
            <h3
              style="margin: 0 0 12px 0; font-family: var(--display); font-size: 18px; color: var(--ink);"
            >
              Hour of Code
            </h3>
            <p
              style="color: var(--muted); font-size: 13px; line-height: 1.6; margin-bottom: 20px; flex: 1;"
            >
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
    <section id="projects" style="margin-bottom: 80px;">
      <div
        style="font-family: var(--mono); font-size: 11px; color: var(--muted); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em;"
      >
        ( technically ) Engineering is our passion
      </div>
      <div style="display: flex; flex-direction: column; gap: 32px;">
        {#each hardcodedProjects as project}
          <a
            href={`https://github.com/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            class="card group grid grid-cols-1 md:grid-cols-2"
            style="padding: 0; text-decoration: none; overflow: hidden;"
          >
            <!-- Left Side: Image -->
            <div
              class="border-b md:border-r md:border-b-0"
              style="border-color: var(--line); display: flex;"
            >
              <img
                src={`https://opengraph.githubassets.com/1/${project.slug}`}
                alt=""
                style="width: 100%; height: 100%; min-height: 200px; object-fit: cover; display: block;"
              />
            </div>
            <!-- Right Side: Content -->
            <div
              style="padding: 32px 24px; display: flex; flex-direction: column; justify-content: center; gap: 16px; background: var(--surface-muted);"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span
                  style="font-family: var(--mono); color: var(--muted); font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase;"
                  >{project.slug}</span
                >
                <span
                  style="color: var(--primary); font-size: 11px; display: flex; align-items: center; gap: 4px;"
                  >View on GitHub <ArrowUpRight size={14} /></span
                >
              </div>
              <div>
                <h2
                  style="font-family: var(--display); font-size: 24px; margin: 0 0 12px 0; color: var(--ink);"
                >
                  {project.name}
                </h2>
                <p style="color: var(--muted); font-size: 14px; margin: 0; line-height: 1.6;">
                  {project.description}
                </p>
              </div>
            </div>
          </a>
        {/each}
        {#if hardcodedProjects.length === 0}
          <p style="color: var(--muted); font-size: 13px;">More projects coming soon.</p>
        {/if}
      </div>
    </section>

    <!-- Scientifically -->
    <section id="scientific" style="margin-bottom: 60px;">
      <div
        style="font-family: var(--mono); font-size: 11px; color: var(--muted); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em;"
      >
        ( scientifically ) Curiosity, kept rigorous
      </div>
      <p
        style="font-size: 15px; color: var(--ink); max-width: 600px; line-height: 1.6; margin-bottom: 32px;"
      >
        We're still early in our research journey — no published papers to point to yet — but the
        habits that lead there are already part of how we work together.
      </p>
      <div
        style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;"
      >
        <div class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          <Microscope size={28} color="var(--primary)" />
          <div>
            <h3
              style="margin: 0 0 8px 0; font-family: var(--display); font-size: 16px; color: var(--ink);"
            >
              Reading groups
            </h3>
            <p style="margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5;">
              We pick apart papers and ideas together, well outside the lecture hall.
            </p>
          </div>
        </div>
        <div class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          <Presentation size={28} color="var(--primary)" />
          <div>
            <h3
              style="margin: 0 0 8px 0; font-family: var(--display); font-size: 16px; color: var(--ink);"
            >
              Guest seminars
            </h3>
            <p style="margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5;">
              Researchers and alumni drop by to share what they're currently working on.
            </p>
          </div>
        </div>
        <div class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
          <Lightbulb size={28} color="var(--primary)" />
          <div>
            <h3
              style="margin: 0 0 8px 0; font-family: var(--display); font-size: 16px; color: var(--ink);"
            >
              Early-stage research
            </h3>
            <p style="margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5;">
              Members pair with faculty to explore open problems, long before any of it becomes a
              paper.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</main>
