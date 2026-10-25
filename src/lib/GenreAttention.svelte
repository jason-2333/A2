<script lang="ts">
  import * as d3 from 'd3';
  import type { TMovie } from '../types';
  import { MIN_GENRE_TITLES, formatCompact, matches, voteSummary, type TAttentionFilter } from './attention';

  type TProps = {
    movies: TMovie[];
    filter: TAttentionFilter;
    metric: 'median' | 'total';
    selectedGenre: string | null;
    width?: number;
  };
  let { movies, filter, metric, selectedGenre = $bindable(), width = 400 }: TProps = $props();

  const margin = { top: 8, right: 104, bottom: 28, left: 92 };
  const rowHeight = 22;

  // Genres are fixed from the full dataset so bars keep their identity while filters change.
  const genres = $derived(
    d3
      .rollups(movies.flatMap((m) => m.genres), (v) => v.length, (g) => g)
      .filter(([, n]) => n >= MIN_GENRE_TITLES)
      .map(([g]) => g)
  );

  const rows = $derived.by(() => {
    const pool = movies.filter((m) => matches(m, filter, 'genre'));
    return genres
      .map((genre) => {
        const summary = voteSummary(pool.filter((m) => m.genres.includes(genre)));
        return { genre, ...summary, value: metric == 'median' ? summary.median : summary.total };
      })
      .sort((a, b) => b.value - a.value || a.genre.localeCompare(b.genre));
  });

  const height = $derived(margin.top + margin.bottom + rows.length * rowHeight);
  const x = $derived(
    d3
      .scaleLinear()
      .domain([0, d3.max(rows, (d) => d.value) || 1])
      .nice()
      .range([margin.left, width - margin.right])
  );
  const y = $derived(
    d3
      .scaleBand()
      .domain(rows.map((d) => d.genre))
      .range([margin.top, height - margin.bottom])
      .padding(0.25)
  );

  let xAxis: SVGGElement | undefined = $state();
  $effect(() => {
    if (!xAxis) return;
    d3.select(xAxis)
      .call(d3.axisBottom(x).ticks(4).tickFormat((d) => formatCompact(+d)))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('line').attr('stroke', '#d8d6d0'));
  });

  function toggle(genre: string) {
    selectedGenre = selectedGenre == genre ? null : genre;
  }
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" role="group" aria-label="Votes per genre">
  {#each x.ticks(4) as tick}
    <line x1={x(tick)} x2={x(tick)} y1={margin.top} y2={height - margin.bottom} stroke="#ecebe6" />
  {/each}
  {#each rows as row (row.genre)}
    {@const active = !selectedGenre || selectedGenre == row.genre}
    <g
      class="row"
      transform="translate(0, {y(row.genre)})"
      role="button"
      tabindex="0"
      aria-pressed={selectedGenre == row.genre}
      aria-label="{row.genre}: {formatCompact(row.value)} votes, {row.count} titles"
      onclick={() => toggle(row.genre)}
      onkeydown={(e) => (e.key == 'Enter' || e.key == ' ') && (e.preventDefault(), toggle(row.genre))}
    >
      <rect class="hit" x="0" y={-3} width={width} height={y.bandwidth() + 6} fill="transparent" />
      <text x={margin.left - 8} y={y.bandwidth() / 2} dy="0.35em" text-anchor="end" class:strong={selectedGenre == row.genre}>{row.genre}</text>
      <rect
        x={margin.left}
        width={Math.max(0, x(row.value) - margin.left)}
        height={y.bandwidth()}
        rx="3"
        fill={selectedGenre == row.genre ? '#184f95' : '#2a78d6'}
        opacity={active ? 1 : 0.28}
      />
      <text x={x(row.value) + 6} y={y.bandwidth() / 2} dy="0.35em" class="value">
        {row.count ? formatCompact(row.value) : '–'} <tspan class="muted">· n={row.count}</tspan>
      </text>
      <title>{row.genre}: {row.count} titles, median {formatCompact(row.median)} votes, total {formatCompact(row.total)} votes</title>
    </g>
  {/each}
  <g transform="translate(0, {height - margin.bottom})" bind:this={xAxis} class="axis" />
</svg>

<style>
  svg { display: block; max-width: 100%; height: auto; font-size: 12px; }
  .row { cursor: pointer; outline: none; }
  .row:hover .hit, .row:focus-visible .hit { fill: #f1f0ec; }
  rect { transition: width 0.4s, opacity 0.2s; }
  text { fill: #2b2a27; }
  .strong { font-weight: 700; }
  .value { font-variant-numeric: tabular-nums; }
  .muted { fill: #8a887f; }
  .axis :global(text) { fill: #6b6a64; }
</style>
