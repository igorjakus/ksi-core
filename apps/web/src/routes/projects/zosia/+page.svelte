<script lang="ts">
  import { ArrowDown, ArrowUpRight, Calendar, MapPin, UsersRound } from '@lucide/svelte';
  import Wrapper from '../../../components/Wrapper.svelte';
  import { editions } from '$lib/data/conferences.js';

  const years = Object.keys(editions).sort((a, b) => Number(b) - Number(a));
</script>

{#snippet hero()}
  <header class="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
    <div>
      <p class="mb-5 font-mono text-xs tracking-widest uppercase">
        [ Winter camp · Since the early 2000s ]
      </p>
      <h1><span class="bg-primary text-primary-content px-3">ZOSIA</span></h1>
      <p class="font-anybody mt-6 text-2xl tracking-tight">
        Winter Camp of Computer Science Students
      </p>
      <p class="text-base-content/65 mt-5 max-w-xl text-lg leading-relaxed">
        Three days of ideas, mountain air, and people who share your curiosity. Nearly 300 students,
        researchers, and technology professionals come together beyond the lecture hall.
      </p>
      <a href="#editions" class="btn btn-primary btn-clipped mt-8 gap-3 px-6"
        >Explore the editions <ArrowDown class="size-4" /></a
      >
    </div>
    <figure class="border-base-content/20 border p-3">
      <img
        src="https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/zosia-2026/01.webp"
        alt="ZOSIA attendees together at a snowy mountain viewpoint"
        class="aspect-4/3 w-full object-cover"
      />
      <figcaption class="text-base-content/60 mt-3 flex justify-between gap-3 font-mono text-xs">
        <span>Outside the lecture hall.</span><span>ZOSIA / 2026</span>
      </figcaption>
    </figure>
  </header>
{/snippet}

<Wrapper name="projects / zosia" {hero}>
  <section class="border-base-content/15 grid gap-8 border-b pb-10 lg:grid-cols-3">
    <div class="bg-base-100">
      <span class="text-primary font-mono text-xs tracking-widest uppercase">Talks</span>
      <p class="text-base-content/65 mt-4 leading-relaxed">
        Lectures and presentations from academia and the technology industry.
      </p>
    </div>
    <div class="bg-base-100">
      <span class="text-primary font-mono text-xs tracking-widest uppercase">People</span>
      <p class="text-base-content/65 mt-4 leading-relaxed">
        Students from different universities sharing knowledge and experience.
      </p>
    </div>
    <div class="bg-base-100">
      <span class="text-primary font-mono text-xs tracking-widest uppercase">Atmosphere</span>
      <p class="text-base-content/65 mt-4 leading-relaxed">
        Excursions and social events in a unique winter setting.
      </p>
    </div>
  </section>

  <section id="editions" class="scroll-mt-20 pt-10 lg:pt-14">
    <div class="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p class="text-primary mb-3 font-mono text-xs tracking-[0.16em] uppercase">
          [ Edition archive ]
        </p>
        <h2 class="mb-0! text-3xl tracking-tight md:text-5xl">Every year tells a story.</h2>
      </div>
      <p class="text-base-content/50 max-w-md text-sm leading-relaxed">
        Browse dates, attendance, locations, and photographs from previous camps.
      </p>
    </div>

    <div class="border-base-content/15 grid gap-6 lg:grid-cols-3">
      {#each years as year (year)}
        {@const edition = editions[year]}
        <a
          href={`/projects/zosia/${year}`}
          class="group bg-base-100 hover:bg-primary/8 border-base-content/20 flex min-h-80 flex-col border p-6 transition-colors md:p-8"
        >
          <div class="flex items-center justify-between">
            <span class="text-base-content/40 text-xs tracking-widest uppercase">Edition</span>
            <ArrowUpRight
              class="group-hover:text-primary size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </div>
          <strong class="font-anybody my-auto text-6xl tracking-tight md:text-7xl">{year}</strong>
          <div class="border-base-content/10 text-base-content/55 space-y-2 border-t pt-5 text-xs">
            <p class="flex items-center gap-2">
              <Calendar class="text-primary size-3.5" />
              {edition.date}
            </p>
            <p class="flex items-center gap-2">
              <UsersRound class="text-primary size-3.5" />
              {edition.participants} participants
            </p>
            <p class="flex items-start gap-2">
              <MapPin class="text-primary mt-0.5 size-3.5 shrink-0" />
              {edition.location}
            </p>
          </div>
        </a>
      {/each}
    </div>
  </section>
</Wrapper>
