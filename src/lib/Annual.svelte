<script lang="ts">
  import type { TMovie } from '../types';
  import { annualRanks, genreCounts } from './movies';
  let { movies }: { movies: TMovie[] } = $props();
  const annual = $derived(annualRanks(movies));
  const min = $derived(annual[0]?.year ?? 1946);
  const max = $derived(annual.at(-1)?.year ?? 2024);
  let start = $state(1946);
  let end = $state(2024);
  let selected = $state<{ year: number; genre: string; count: number; rank: number } | null>(null);
  const years = $derived(Array.from({length: Math.max(0, end-start+1)}, (_, i) => start+i));
  const genres = $derived(genreCounts(movies).map(d => d[0]));
  const lookup = $derived(new Map(annual.map(d => [d.year, d])));
  const appearances = $derived(genres.map(genre => ({ genre, count: annual.filter(y => y.top.some(t => t.genre === genre)).length })).sort((a,b) => b.count-a.count));
  const cellWidth = $derived(Math.max(12, 940/years.length));
  const width = $derived(145+years.length*cellWidth+18);
  const missingYears = $derived(Array.from({length: max-min+1}, (_,i)=>min+i).filter(year=>!lookup.has(year)));
  const fills = ['#742e42', '#b6717d', '#e4bbc2'];
  function select(year: number, genre: string) {
    const item = lookup.get(year)?.top.find(t => t.genre === genre);
    selected = { year, genre, count: item?.count ?? 0, rank: item?.rank ?? 0 };
  }
</script>

<div class="chart-controls">
  <div class="range-fields">
    <label>From <select aria-label="From" bind:value={start} onchange={() => { if (start > end) end = start; selected = null; }}>{#each Array.from({length:max-min+1}, (_,i)=>min+i) as y}<option value={y}>{y}</option>{/each}</select></label>
    <span>—</span>
    <label>To <select aria-label="To" bind:value={end} onchange={() => { if (end < start) start = end; selected = null; }}>{#each Array.from({length:max-min+1}, (_,i)=>min+i) as y}<option value={y}>{y}</option>{/each}</select></label>
    <button class="text-button" onclick={() => { start=min; end=max; selected=null; }}>Reset</button>
  </div>
  <div class="rank-legend">{#each fills as fill, i}<span><i style:background={fill}></i>#{i+1}</span>{/each}<span><i style:background="var(--paper)"></i>Outside top 3</span></div>
</div>
<div class="chart-scroll">
  <svg viewBox="0 0 {width} {genres.length*23+62}" style:min-width="900px" role="group" aria-label="Annual top three genres from {start} to {end}. Rows are genres, columns are years, and color and numbers indicate annual rank.">
    {#each genres as genre, row}
      <text x="128" y={row*23+51} text-anchor="end" class="label">{genre}</text>
      {#each years as year, col}
        {@const entry = lookup.get(year)?.top.find(t => t.genre === genre)}
        <rect x={145+col*cellWidth} y={row*23+36} width={cellWidth-1.5} height="20" rx="2"
          fill={entry ? fills[entry.rank-1] : '#f1eee8'}
          opacity={selected && selected.genre !== genre && selected.year !== year ? 0.45 : 1}
          tabindex="0" role="button" aria-label="{year}, {genre}: {entry ? `rank ${entry.rank}, ${entry.count} movies` : 'outside the annual top 3'}"
          onclick={() => select(year, genre)} onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(year, genre); } }}
          onmouseover={() => select(year, genre)} onfocus={() => select(year, genre)} onmouseout={() => selected=null} onblur={() => selected=null}>
          <title>{year} · {genre}: {entry ? `#${entry.rank} (${entry.count} movies)` : 'outside annual top 3'}</title>
        </rect>
        {#if entry}<text x={145+(col+.5)*cellWidth-.75} y={row*23+50} text-anchor="middle" font-size="9" fill={entry.rank === 1 ? '#fff' : '#512636'} style="pointer-events:none">{entry.rank}</text>{/if}
      {/each}
    {/each}
    {#each years as year, col}
      {#if years.length <= 20 || year % 5 === 0 || col === 0 || col === years.length-1}
        <text x={145+(col+.5)*cellWidth} y="22" text-anchor="middle" class="year">{year}</text>
      {/if}
    {/each}
    <text x={width/2} y={genres.length*23+58} text-anchor="middle" class="label">Release year →</text>
  </svg>
</div>
<div class="chart-readout" aria-live="polite">
  {#if selected}<strong>{selected.year} · {selected.genre}</strong><span>{selected.rank ? `Rank #${selected.rank} · ${selected.count} movies that year` : 'Outside the annual top three (or no genre data for this year)'}</span>
  {:else}<strong>A different top three, every year</strong><span>Hover or focus a cell to inspect its annual rank and movie count.</span>{/if}
</div>
<p class="method">Ranked by movies released in each year; tied counts use alphabetical order. Years with fewer than three genres show fewer ranks. Blank cells are outside the top three; {missingYears.join(', ')} has no titles. {movies.filter(m=>m.year===null).length} title with an unknown year is excluded.</p>
<div class="insight"><span class="insight-label">WHAT THE DATA SAYS</span><p>{appearances[0]?.genre} appears in the top three in {appearances[0]?.count} of {annual.filter(y=>y.top.length).length} years with known genres, followed by {appearances[1]?.genre} ({appearances[1]?.count}) and {appearances[2]?.genre} ({appearances[2]?.count}). The selected top three change from {annual[0]?.top.map(t=>t.genre).join(', ')} ({min}) to {annual.at(-1)?.top.map(t=>t.genre).join(', ')} ({max}). No genre stays in the top three every year. Early years have small samples and many ties, so their ranks are less stable; use the year controls to compare periods.</p></div>
<style>
  svg { width:100%;display:block; } .label{font-size:12px;fill:#625853;} .year{font-size:10px;fill:#625853;}
  .rank-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#706a66;} .rank-legend span{display:flex;gap:5px;align-items:center;} i{width:12px;height:12px;border-radius:2px;display:inline-block;}
  .range-fields{display:flex;gap:12px;align-items:center;}label{font-size:12px;color:#706a66;}select{margin-left:6px;}
</style>
