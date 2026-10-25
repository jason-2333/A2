<script lang="ts">
  import type { TMovie } from '../types';
  import * as d3 from 'd3';
  import { genreCounts } from './movies';
  type Props = { movies: TMovie[]; progress?: number; width?: number; height?: number };
  let { movies, progress = 100, width = 1100, height = 380 }: Props = $props();
  let selectedGenre: string | undefined = $state();
  const dated = $derived(movies.filter(m => m.year !== null));
  const yearRange = $derived(d3.extent(dated, m => m.year!.getTime()));
  const upYear = $derived(yearRange[0] === undefined ? 0 : yearRange[0] + ((yearRange[1] ?? yearRange[0]) - yearRange[0]) * progress / 100);
  const filtered = $derived(progress === 100 ? movies : dated.filter(m => m.year!.getTime() <= upYear));
  const genreNums = $derived(genreCounts(filtered));
  const margin = { top: 25, right: 20, bottom: 105, left: 55 };
  const bottom = $derived(height - margin.bottom);
  const xScale = $derived(d3.scaleBand<string>().domain(genreNums.map(d => d[0])).range([margin.left, width - margin.right]).padding(0.24));
  const yScale = $derived(d3.scaleLinear().domain([0, d3.max(genreNums, d => d[1]) || 1]).nice().range([bottom, margin.top]));
  const selected = $derived(genreNums.find(d => d[0] === selectedGenre));
</script>

<div class="chart-scroll">
  <svg viewBox="0 0 {width} {height}" class="distribution" role="group" aria-label="Number of summer movies by genre, sorted from most to least frequent">
    {#each yScale.ticks(5) as tick}
      <line x1={margin.left} x2={width-margin.right} y1={yScale(tick)} y2={yScale(tick)} stroke="#e7e2da" />
      <text x={margin.left-12} y={yScale(tick)+4} text-anchor="end" class="axis">{tick}</text>
    {/each}
    <text x="13" y={bottom / 2} transform="rotate(-90, 13, {bottom / 2})" text-anchor="middle" class="axis">Number of movies</text>
    {#each genreNums as [genre, count]}
      <rect x={xScale(genre)} y={yScale(count)} width={xScale.bandwidth()} height={bottom-yScale(count)}
        fill={selectedGenre === genre ? '#b85e36' : '#742e42'} opacity={selectedGenre && selectedGenre !== genre ? 0.38 : 1}
        tabindex="0" role="button" aria-label="{genre}: {count} movies"
        onclick={() => selectedGenre = genre} onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectedGenre = genre; } }}
        onmouseover={() => selectedGenre = genre} onmouseout={() => selectedGenre = undefined}
        onfocus={() => selectedGenre = genre} onblur={() => selectedGenre = undefined}>
        <title>{genre}: {count} movies ({(count / movies.length * 100).toFixed(1)}% of all titles)</title>
      </rect>
      <text x={xScale(genre)! + xScale.bandwidth()/2} y={yScale(count)-8} text-anchor="middle" class="count">{count}</text>
      <text transform="translate({xScale(genre)! + xScale.bandwidth()/2}, {bottom+15}) rotate(48)" class="axis">{genre}</text>
    {/each}
    <text x={width / 2} y={height-4} text-anchor="middle" class="axis">Genre</text>
  </svg>
</div>
<div class="chart-readout" aria-live="polite">
  {#if selected}<strong>{selected[0]}</strong><span>{selected[1]} movies · {(selected[1]/movies.length*100).toFixed(1)}% of all titles</span>
  {:else}<strong>Explore the bars</strong><span>Hover or focus a bar to see its share of the collection.</span>{/if}
</div>

<style>
  .distribution { width:100%; min-width:780px; display:block; }
  .axis { font-size:12px; fill:#706a66; } .count { font-size:12px; fill:#40332f; }
  rect { transition:opacity .15s,fill .15s; } rect:focus { outline:2px solid #b85e36; }
</style>
