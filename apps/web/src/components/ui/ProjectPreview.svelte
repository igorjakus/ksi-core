<script lang="ts">
  let { kind }: { kind: 'conference' | 'education' | 'quantum' | 'chess' | 'biology' } = $props();
</script>

<div class="preview" aria-hidden="true">
  {#if kind === 'conference'}
    <img
      src="https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/zosia-2026/01.webp"
      alt=""
      loading="lazy"
    />
  {:else if kind === 'education'}
    <img
      src="https://pub-4e8af66414434008bafa6614f6af4b22.r2.dev/project-hoc-past/8.webp"
      alt=""
      loading="lazy"
    />
  {:else if kind === 'chess'}
    <svg class="chessboard" viewBox="0 0 280 280" fill="none">
      <rect x="19" y="19" width="242" height="242" stroke="var(--color-primary)" />
      {#each Array(64) as _, i}
        <rect
          class="chess-square"
          x={20 + (i % 8) * 30}
          y={20 + Math.floor(i / 8) * 30}
          width="30"
          height="30"
          fill={(Math.floor(i / 8) + (i % 8)) % 2 === 0
            ? 'var(--color-secondary)'
            : 'var(--color-neutral)'}
        />
      {/each}
      <g
        fill="var(--color-neutral)"
        stroke="var(--color-primary)"
        stroke-width="1"
        font-size="29"
        text-anchor="middle"
        font-family="serif"
      >
        <!-- @wc-ignore -->
        <text x="125" y="133">♞</text>
        <!-- @wc-ignore -->
        <text x="185" y="193">♔</text>
      </g>
      <g fill="var(--color-primary)" font-size="10" text-anchor="middle" font-family="monospace">
        {#each ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as file, i}<text x={35 + i * 30} y="275"
            >{file}</text
          >{/each}
        {#each [8, 7, 6, 5, 4, 3, 2, 1] as rank, i}<text x="9" y={39 + i * 30}>{rank}</text>{/each}
      </g>
    </svg>
  {:else if kind === 'quantum'}
    <svg viewBox="0 0 480 240" fill="none">
      <g stroke="currentColor" stroke-width="1.5" opacity="0.45">
        <path d="M40 70H440M40 120H440M40 170H440M280 70V170" />
      </g>
      <g fill="var(--color-primary)" stroke="var(--color-primary)">
        <rect x="96" y="49" width="42" height="42" />
        <rect x="176" y="99" width="42" height="42" />
        <circle cx="280" cy="70" r="6" />
        <circle cx="280" cy="170" r="12" fill="none" stroke-width="2" />
      </g>
      <g fill="var(--color-neutral)" font-family="monospace" font-size="19" text-anchor="middle">
        <!-- @wc-ignore -->
        <text x="117" y="77">H</text>
        <!-- @wc-ignore -->
        <text x="197" y="127">X</text>
      </g>
      <g stroke="currentColor" opacity="0.7">
        <rect x="352" y="49" width="42" height="42" /><path
          d="M362 79A11 11 0 0 1 384 79M373 79L381 62"
        />
        <rect x="352" y="99" width="42" height="42" /><path
          d="M362 129A11 11 0 0 1 384 129M373 129L381 112"
        />
      </g>
    </svg>
  {:else}
    <svg viewBox="0 0 480 240" fill="none">
      <g stroke="var(--color-secondary)" stroke-width="1.5" opacity="0.65">
        <path
          d="M70 150L145 62L220 120L320 48L410 100L338 184L220 120L135 192L70 150M145 62L135 192M320 48L338 184M70 150L220 120L410 100M135 192L338 184"
        />
        <path d="M145 62L320 48M70 150L338 184M220 120L245 207" opacity="0.35" />
      </g>
      {#each [[70, 150], [145, 62], [220, 120], [320, 48], [410, 100], [338, 184], [135, 192], [245, 207]] as [x, y], i}
        <circle cx={x} cy={y} r={i === 2 ? 14 : 5} fill="var(--color-secondary)" />
        <circle
          cx={x}
          cy={y}
          r={i === 2 ? 26 : 12}
          stroke="var(--color-secondary)"
          opacity="0.25"
        />
      {/each}
    </svg>
  {/if}
</div>

<style>
  .preview {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 15rem;
    height: 100%;
    overflow: hidden;
    color: var(--color-primary);
    background-color: var(--color-neutral);
    background-image: radial-gradient(
      color-mix(in oklch, var(--color-primary) 20%, transparent) 1px,
      transparent 1px
    );
    background-size: 16px 16px;
  }
  .preview svg {
    width: 100%;
    max-width: 34rem;
  }
  .preview img {
    width: 100%;
    height: 100%;
    position: absolute;
    object-fit: cover;
    filter: saturate(0.5);
    transition:
      filter 350ms,
      transform 500ms;
  }
  .preview::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid color-mix(in oklch, var(--color-primary) 18%, transparent);
    pointer-events: none;
  }
  :global(a:hover) .preview img {
    filter: saturate(1);
    transform: scale(1.035);
  }
  .preview svg.chessboard {
    width: 14rem;
    height: 14rem;
    max-width: 100%;
  }
  @media (prefers-reduced-motion: reduce) {
    .preview img {
      transition: none;
    }
    :global(a:hover) .preview img {
      transform: none;
    }
  }
</style>
