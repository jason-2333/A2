<script lang="ts">
  import * as d3 from 'd3';
  import type { TMovie } from '../types';
  import { genreCounts, cooccurrences } from './movies';
  let { movies }: { movies: TMovie[] } = $props();
  let mode = $state('count');
  let selected = $state<{a:string;b:string;row:number;col:number;count:number}|null>(null);
  const totals = $derived(new Map(genreCounts(movies)));
  const genres = $derived([...totals.keys()]);
  const cells = $derived(cooccurrences(movies, genres));
  const maximum = $derived(d3.max(cells.filter(d=>d.a!==d.b), d=>d.count) || 1);
  const color = $derived(d3.scaleSequential(d3.interpolateRgb('#f7eee8','#742e42')).domain([0, mode === 'count' ? maximum : 1]));
  const comedyPairs = $derived(cells.filter(d=>d.a==='Comedy' && d.b!=='Comedy').sort((a,b)=>b.count-a.count));
  const size = 28;
  const left = 115;
  const top = 105;
  const dimension = $derived(left+genres.length*size+15);
  function value(cell: typeof cells[number]) {
    return mode === 'count' ? cell.count : cell.count / (totals.get(cell.a) || 1);
  }
</script>

<div class="chart-controls">
  <div class="segmented" aria-label="Matrix measure">
    <button class:active={mode==='count'} aria-pressed={mode==='count'} onclick={() => mode='count'}>Movie count</button>
    <button class:active={mode==='share'} aria-pressed={mode==='share'} onclick={() => mode='share'}>Share of row genre</button>
  </div>
  <div class="scale-key"><span>0</span><div></div><span>{mode==='count' ? maximum : '100%'}</span></div>
</div>
<div class="chart-scroll">
  <svg viewBox="0 0 {dimension} {top+genres.length*size+35}" class="matrix" role="group" aria-label="All-genre co-occurrence matrix. {mode==='count' ? 'Cell values count movies with both genres.' : 'Cell values are the percentage of movies in the row genre that also have the column genre.'}">
    {#each genres as genre, i}
      <text x={left-10} y={top+i*size+18} text-anchor="end" class="label" font-weight={selected?.a===genre ? 700 : 400}>{genre}</text>
      <text transform="translate({left+i*size+18}, {top-10}) rotate(-55)" class="label" font-weight={selected?.b===genre ? 700 : 400}>{genre}</text>
    {/each}
    {#each cells as cell}
      <rect x={left+cell.col*size} y={top+cell.row*size} width={size-2} height={size-2} rx="2"
        fill={cell.a===cell.b ? '#e4dfd7' : cell.count===0 ? '#f5f2ed' : color(value(cell))}
        stroke={selected?.a===cell.a && selected?.b===cell.b ? '#2a1c20' : 'none'} stroke-width="2"
        opacity={selected && selected.row!==cell.row && selected.col!==cell.col ? 0.45 : 1}
        tabindex="0" role="button" aria-label="{cell.a} and {cell.b}: {cell.count} movies, {(cell.count/(totals.get(cell.a)||1)*100).toFixed(1)}% of {cell.a} movies"
        onclick={() => selected=cell} onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selected=cell; } }}
        onmouseover={() => selected=cell} onmouseout={() => selected=null} onfocus={() => selected=cell} onblur={() => selected=null}>
        <title>{cell.a} + {cell.b}: {cell.count} movies ({(cell.count/(totals.get(cell.a)||1)*100).toFixed(1)}% of {cell.a})</title>
      </rect>
      {#if cell.count>0}<text x={left+cell.col*size+13} y={top+cell.row*size+17} text-anchor="middle" font-size="9"
        fill={cell.a!==cell.b && value(cell) > (mode==='count' ? maximum*.6 : .6) ? '#fff' : '#69464b'} style="pointer-events:none">{mode==='count' ? cell.count : (value(cell)<.01 ? '<1%' : Math.round(value(cell)*100)+'%')}</text>{/if}
    {/each}
    <text x={dimension/2} y={top+genres.length*size+27} text-anchor="middle" class="label">Column genre · rows and columns ordered by overall frequency</text>
  </svg>
</div>
<div class="chart-readout" aria-live="polite">
  {#if selected}<strong>{selected.a}{selected.a===selected.b ? ' · total' : ` × ${selected.b}`}</strong><span>{selected.count} movies · {(selected.count/(totals.get(selected.a)||1)*100).toFixed(1)}% of {selected.a} titles</span>
  {:else}<strong>Find the connections</strong><span>Hover or focus a cell to explore both genres. Darker means more co-occurrence.</span>{/if}
</div>
<p class="method">All {genres.length} known genres appear together. Each movie contributes once to each pair. Gray diagonal cells show genre totals; blank cells mean zero. Row share = pair count ÷ row genre total, so that view is directional. Co-occurrence describes association, not causation or a statistical correlation coefficient.</p>
<div class="insight"><span class="insight-label">WHAT THE DATA SAYS</span><p>Comedy most often appears with {comedyPairs[0]?.b}: {comedyPairs[0]?.count} movies ({((comedyPairs[0]?.count ?? 0)/(totals.get('Comedy')||1)*100).toFixed(0)}% of Comedy titles). Next are {comedyPairs[1]?.b} ({comedyPairs[1]?.count}) and {comedyPairs[2]?.b} ({comedyPairs[2]?.count}). Counts favor common genres; switch to row share to compare proportions. Rare genres may have large percentages based on very few movies.</p></div>
<style>
  .matrix{width:min(100%,860px);min-width:760px;display:block;margin:auto;} .label{font-size:11px;fill:#625853;}
  .scale-key{display:flex;align-items:center;gap:8px;font-size:12px;color:#706a66;} .scale-key div{width:120px;height:9px;border-radius:2px;background:linear-gradient(to right,#f7eee8,#742e42);}
</style>
