<script lang="ts">
  import * as d3 from 'd3';
  import type { TMovie } from '../types';
  import { decadeOf, formatCompact, matches, voteSummary, type TAttentionFilter } from './attention';

  type TProps = {
    movies: TMovie[];
    filter: TAttentionFilter;
    metric: 'median' | 'total';
    selectedDecade: number | null;
    width?: number;
  };
  let { movies, filter, metric, selectedDecade = $bindable(), width = 640 }: TProps = $props();

  const margin = { top: 22, right: 20, bottom: 34, left: 56 };
  const height = 200;

  const decades = $derived(
    [...new Set(movies.map(decadeOf).filter((d): d is number => d !== null))].sort((a, b) => a - b)
  );

  const bars = $derived.by(() => {
    const pool = movies.filter((m) => matches(m, filter, 'decade'));
    return decades.map((decade) => {
      const summary = voteSummary(pool.filter((m) => decadeOf(m) == decade));
      return { decade, ...summary, value: metric == 'median' ? summary.median : summary.total };
    });
  });

  const x = $derived(
    d3.scaleBand<number>().domain(decades).range([margin.left, width - margin.right]).padding(0.2)
  );
  const y = $derived(
    d3
      .scaleLinear()
      .domain([0, d3.max(bars, (d) => d.value) || 1])
      .nice()
      .range([height - margin.bottom, margin.top])
  );

  let yAxis: SVGGElement | undefined = $state();
  $effect(() => {
    if (!yAxis) return;
    d3.select(yAxis)
      .call(d3.axisLeft(y).ticks(4).tickFormat((d) => formatCompact(+d)))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('line').attr('stroke', '#d8d6d0'));
  });

  function toggle(decade: number) {
    selectedDecade = selectedDecade == decade ? null : decade;
  }
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" role="group" aria-label="Votes per decade">
  {#each y.ticks(4) as tick}
    <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke="#ecebe6" />
  {/each}
  {#each bars as bar (bar.decade)}
    {@const active = selectedDecade === null || selectedDecade == bar.decade}
    <g
      class="bar"
      role="button"
      tabindex="0"
      aria-pressed={selectedDecade == bar.decade}
      aria-label="{bar.decade}s: {formatCompact(bar.value)} votes, {bar.count} titles"
      onclick={() => toggle(bar.decade)}
      onkeydown={(e) => (e.key == 'Enter' || e.key == ' ') && (e.preventDefault(), toggle(bar.decade))}
    >
      <rect class="hit" x={x(bar.decade)} y={margin.top - 18} width={x.bandwidth()} height={height - margin.top - margin.bottom + 18 + 22} fill="transparent" />
      <rect
        x={x(bar.decade)}
        y={y(bar.value)}
        width={x.bandwidth()}
        height={Math.max(0, y(0) - y(bar.value))}
        rx="3"
        fill={selectedDecade == bar.decade ? '#184f95' : '#2a78d6'}
        opacity={active ? 1 : 0.28}
      />
      <text x={(x(bar.decade) ?? 0) + x.bandwidth() / 2} y={y(bar.value) - 5} text-anchor="middle" class="value">
        {bar.count ? formatCompact(bar.value) : ''}
      </text>
      <text x={(x(bar.decade) ?? 0) + x.bandwidth() / 2} y={height - margin.bottom + 15} text-anchor="middle" class="tick" class:strong={selectedDecade == bar.decade}>
        {bar.decade}s
      </text>
      <text x={(x(bar.decade) ?? 0) + x.bandwidth() / 2} y={height - 1} text-anchor="middle" class="sub">n={bar.count}</text>
      <title>{bar.decade}s: {bar.count} titles, median {formatCompact(bar.median)} votes, total {formatCompact(bar.total)} votes</title>
    </g>
  {/each}
  <g transform="translate({margin.left}, 0)" bind:this={yAxis} class="axis" />
</svg>

<style>
  svg { display: block; max-width: 100%; height: auto; font-size: 12px; overflow: visible; }
  .bar { cursor: pointer; outline: none; }
  .bar:hover .hit, .bar:focus-visible .hit { fill: #f1f0ec; }
  rect { transition: y 0.4s, height 0.4s, opacity 0.2s; }
  .value, .tick { fill: #2b2a27; font-variant-numeric: tabular-nums; }
  .sub { fill: #6b6a64; font-size: 11px; }
  .strong { font-weight: 700; }
  .axis :global(text) { fill: #6b6a64; }
</style>
