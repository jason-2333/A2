<script lang="ts">
  import * as d3 from 'd3';
  import type { TMovie } from '../types';
  import { FORMATS, FORMAT_COLOR, FORMAT_LABEL, formatCompact, formatVotes, matches, type TAttentionFilter, type TFormat } from './attention';

  type TProps = { movies: TMovie[]; filter: TAttentionFilter; width?: number };
  let { movies, filter, width = 640 }: TProps = $props();

  const margin = { top: 10, right: 20, bottom: 46, left: 150 };
  const rowHeight = 64;
  const height = margin.top + margin.bottom + FORMATS.length * rowHeight;

  const x = $derived(
    d3
      .scaleLog()
      .domain([10, d3.max(movies, (d) => d.num_votes) ?? 1e6])
      .nice()
      .range([margin.left, width - margin.right])
  );
  const y = d3.scaleBand<string>().domain(FORMATS).range([margin.top, height - margin.bottom]).padding(0.12);

  // Stable pseudo-random jitter from the title id so points don't jump when filters change.
  function jitter(id: string) {
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return (h % 1000) / 1000 - 0.5;
  }

  const visible = $derived(movies.filter((m) => filter.formats.includes(m.title_type as TFormat)));
  const isHighlighted = (m: TMovie) => matches(m, filter);
  const narrowed = $derived(filter.genre !== null || filter.decade !== null);

  // Draw the highlighted points last so they sit on top of the faded ones.
  const ordered = $derived([...visible].sort((a, b) => Number(isHighlighted(a)) - Number(isHighlighted(b))));

  const medians = $derived(
    FORMATS.map((format) => {
      const pool = visible.filter((m) => m.title_type == format && isHighlighted(m));
      return { format, count: pool.length, median: d3.median(pool, (d) => d.num_votes) };
    })
  );

  let hovered: TMovie | null = $state(null);
  let tip = $state({ x: 0, y: 0 });

  let xAxis: SVGGElement | undefined = $state();
  $effect(() => {
    if (!xAxis) return;
    d3.select(xAxis)
      .call(d3.axisBottom(x).ticks(6, (d: d3.NumberValue) => formatCompact(+d)))
      .call((g) => g.select('.domain').attr('stroke', '#bdbbb4'));
  });
</script>

<div class="wrap">
  <svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="IMDb votes per title by format, log scale">
    {#each x.ticks(6) as tick}
      {#if Math.log10(tick) % 1 === 0}
        <line x1={x(tick)} x2={x(tick)} y1={margin.top} y2={height - margin.bottom} stroke="#ecebe6" />
      {/if}
    {/each}
    {#each FORMATS as format}
      {@const m = medians.find((d) => d.format == format)}
      <g transform="translate(0, {y(format)})">
        <rect x={margin.left} width={width - margin.left - margin.right} height={y.bandwidth()} fill="#faf9f6" />
        <circle cx="10" cy={y.bandwidth() / 2 - 8} r="5" fill={FORMAT_COLOR[format]} />
        <text x="20" y={y.bandwidth() / 2 - 8} dy="0.35em" class="label">{FORMAT_LABEL[format]}</text>
        <text x="20" y={y.bandwidth() / 2 + 9} dy="0.35em" class="sub">
          {#if filter.formats.includes(format)}n={m?.count ?? 0}{#if m?.median} · median {formatCompact(m.median)}{/if}{:else}hidden{/if}
        </text>
      </g>
    {/each}
    <g class="points">
      {#each ordered as movie (movie.tconst)}
        {@const on = isHighlighted(movie)}
        <circle
          cx={x(Math.max(10, movie.num_votes))}
          cy={(y(movie.title_type) ?? 0) + y.bandwidth() / 2 + jitter(movie.tconst) * (y.bandwidth() - 12)}
          r={hovered == movie ? 6 : 4}
          fill={on ? FORMAT_COLOR[movie.title_type as TFormat] : '#c9c7c0'}
          fill-opacity={on ? (narrowed ? 0.9 : 0.55) : 0.35}
          stroke={hovered == movie ? '#111' : '#fff'}
          stroke-width={hovered == movie ? 1.5 : 0.75}
          role="presentation"
          onmouseenter={(e) => { hovered = movie; tip = { x: e.offsetX, y: e.offsetY }; }}
          onmouseleave={() => (hovered = null)}
        />
      {/each}
    </g>
    {#each medians as m}
      {#if m.median && filter.formats.includes(m.format)}
        <line
          x1={x(m.median)} x2={x(m.median)}
          y1={(y(m.format) ?? 0) + 2} y2={(y(m.format) ?? 0) + y.bandwidth() - 2}
          stroke="#111" stroke-width="2"
        />
      {/if}
    {/each}
    <g transform="translate(0, {height - margin.bottom})" bind:this={xAxis} class="axis" />
    <text x={(margin.left + width - margin.right) / 2} y={height - 4} text-anchor="middle" class="sub">IMDb votes per title (log scale) — black tick = median of highlighted titles</text>
  </svg>
  {#if hovered}
    <div class="tooltip" style="left:{tip.x + 12}px; top:{tip.y + 12}px">
      <strong>{hovered.primary_title}</strong>
      <span>{hovered.year?.getFullYear() ?? 'year unknown'} · {FORMAT_LABEL[hovered.title_type as TFormat]}</span>
      <span>{formatVotes(hovered.num_votes)} votes · rating {hovered.average_rating}</span>
      <span>{hovered.genres.join(', ') || 'genre unknown'}</span>
    </div>
  {/if}
</div>

<style>
  .wrap { position: relative; }
  svg { display: block; max-width: 100%; height: auto; font-size: 12px; }
  .label { fill: #2b2a27; font-weight: 600; }
  .sub { fill: #6b6a64; font-size: 11px; font-variant-numeric: tabular-nums; }
  .axis :global(text) { fill: #6b6a64; }
  .points circle { transition: fill 0.2s, fill-opacity 0.2s; }
  .tooltip {
    position: absolute;
    pointer-events: none;
    background: #fff;
    border: 1px solid #d8d6d0;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.08);
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: 240px;
    z-index: 2;
  }
  .tooltip span { color: #52514e; }
</style>
