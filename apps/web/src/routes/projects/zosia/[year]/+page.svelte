<script lang="ts">
  import { ArrowLeft, Calendar, Images, MapPin, UsersRound } from '@lucide/svelte';
  import DynamicGallery from '../../../../components/DynamicGallery.svelte';
  import Wrapper from '../../../../components/Wrapper.svelte';
  import { api } from '$lib/backend';

  let {
    data
  }: {
    data: {
      year: string;
      edition: {
        location: string;
        participants: number;
        date: string;
        bgImage?: string;
      };
    };
  } = $props();
  let bgImage = $state('');

  $effect(() => {
    bgImage = '';
    if (!data.edition.bgImage) return;

    api
      .gallery({ id: `zosia-${data.year}` })
      .bg({ name: data.edition.bgImage })
      .get()
      .then((response) => {
        if (response.data) bgImage = response.data;
      })
      .catch(() => {
        bgImage = '';
      });
  });
</script>

{#snippet emptyState()}
  <div class="border-base-content/20 border border-dashed px-6 py-16 text-center">
    <Images class="text-base-content/25 mx-auto mb-5 size-8" />
    <h3 class="mb-3! text-xl">No photographs in the archive yet.</h3>
    <p class="text-base-content/55 mx-auto max-w-2xl text-sm leading-relaxed">
      If you have photos from ZOSIA {data.year}, send them to
      <span class="text-primary font-medium">ksi [at] cs.uni.wroc.pl</span> so we can preserve them here.
    </p>
  </div>
{/snippet}

{#snippet hero()}
  <header class="grid gap-10 lg:grid-cols-2 lg:items-center">
    <div>
      <p class="mb-5 font-mono text-xs tracking-widest uppercase">
        [ Winter camp / Edition archive ]
      </p>
      <h1>ZOSIA <span class="bg-primary text-primary-content px-3">{data.year}</span></h1>
      <p class="text-base-content/65 mt-6 text-lg">
        {data.edition.date}<br />{data.edition.location}
      </p>
      <a href="/projects/zosia" class="group btn btn-soft mt-8 gap-3"
        ><ArrowLeft class="size-4 transition-transform group-hover:-translate-x-0.5" />Back to all
        editions</a
      >
    </div>
    {#if bgImage}
      <img
        src={bgImage}
        alt={`ZOSIA ${data.year} camp photograph`}
        class="clipped aspect-4/3 w-full object-cover"
      />
    {:else}
      <div
        aria-hidden="true"
        class="border-base-content/20 bg-primary/10 font-anybody flex aspect-4/3 items-center justify-center border text-[clamp(4rem,12vw,10rem)] tracking-tight"
      >
        {data.year}
      </div>
    {/if}
  </header>
{/snippet}

<Wrapper name={`projects / zosia / ${data.year}`} {hero}>
  <section class="bg-base-content/15 border-base-content/15 grid gap-px border md:grid-cols-3">
    <div class="bg-base-100 p-6 md:p-8">
      <span
        class="text-base-content/40 mb-8 flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
        ><MapPin class="text-primary size-4" /> Location</span
      >
      <p class="leading-relaxed">{data.edition.location}</p>
    </div>
    <div class="bg-base-100 p-6 md:p-8">
      <span
        class="text-base-content/40 mb-8 flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
        ><UsersRound class="text-primary size-4" /> Participants</span
      >
      <p class="text-3xl font-bold">{data.edition.participants}</p>
    </div>
    <div class="bg-base-100 p-6 md:p-8">
      <span
        class="text-base-content/40 mb-8 flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
        ><Calendar class="text-primary size-4" /> Camp date</span
      >
      <p class="leading-relaxed">{data.edition.date}</p>
    </div>
  </section>

  <section class="py-16 lg:py-24">
    <div class="mb-10">
      <p class="text-primary mb-3 text-xs font-bold tracking-[0.2em] uppercase">Photo archive</p>
      <h2 class="mb-0! text-3xl tracking-tight md:text-5xl">Moments from {data.year}</h2>
    </div>
    <DynamicGallery empty={emptyState} id={`zosia-${data.year}`} />
  </section>
</Wrapper>
