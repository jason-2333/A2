<script lang="ts">
  const designs = [
    { q:'Q1', name:'Annual rank heatmap', chosen:true, type:'heatmap', encoding:'Year (temporal) → x; genre (categorical) → y. Rectangles use lightness and a numeral to encode annual rank 1–3. Unranked cells stay blank.', reason:'Chosen: aligned years and fixed genre rows make entries, exits, and persistence easy to compare across the entire timeline.' },
    { q:'Q1', name:'Bump chart', chosen:false, type:'bump', encoding:'Year → x; rank → y. A colored line identifies each genre; points mark its annual rank. Lines break whenever a genre leaves the top three.', reason:'Shows rank changes directly, but overlapping lines and frequent gaps make the long timeline harder to read.' },
    { q:'Q1', name:'Annual grouped bars', chosen:false, type:'bars', encoding:'Year → x groups; movie count (quantitative) → bar height. Each year has its own three leading genres, identified by color and labels.', reason:'Preserves the movie counts, but dozens of groups need much more space and make long-term persistence difficult to follow.' },
    { q:'Q2', name:'Co-occurrence matrix', chosen:true, type:'matrix', encoding:'Genre → both axes. Each square encodes a pair of genres; color lightness and a number encode shared movie count. Optional row shares encode conditional proportions.', reason:'Chosen: every genre is visible at once, aligned cells support comparison, and explicit numbers show weak as well as strong relationships.' },
    { q:'Q2', name:'Weighted network', chosen:false, type:'network', encoding:'Genre → node; node area → genre total. An edge connects genres that share movies; edge width → shared movie count. Color identifies a genre.', reason:'Makes clusters visible, but crossings and variable node positions make precise pairwise comparisons difficult.' },
    { q:'Q2', name:'Genre chord diagram', chosen:false, type:'chord', encoding:'Genres (categorical) → labeled sectors around a circle and sector colors. Ribbons join co-occurring genres; ribbon width at both ends → shared movie count (quantitative). All genres appear in one circle.', reason:'Shows major connections in a compact circular layout, but overlapping ribbons and curved widths make exact comparisons and small counts harder to read than a labeled matrix.' }
  ];
</script>
<div class="sketch-grid">
  {#each designs as design}
    <article class="sketch">
      <div class="sketch-title"><span>{design.q} / {design.name}</span>{#if design.chosen}<em>SELECTED</em>{/if}</div>
      <svg viewBox="0 0 280 145" role="img" aria-label="Concept sketch: {design.name}. Illustrative data only.">
        {#if design.type==='heatmap' || design.type==='matrix'}
          {#each Array.from({length:design.type==='heatmap'?4:5}) as _,row}
            {#each Array.from({length:8}) as _,col}
              <rect x={45+col*24} y={20+row*22} width="20" height="18" rx="2" fill={['#eee9e2','#e4bbc2','#b6717d','#742e42'][(row*3+col*2+Math.floor(col/3))%4]} />
            {/each}
          {/each}
          <text x="8" y="68">Genre</text><text x="124" y="140">{design.type==='heatmap'?'Year →':'Genre →'}</text>
        {:else if design.type==='bump'}
          <path d="M40 35 L90 68 L140 35 L190 100 L240 68" stroke="#742e42" stroke-width="3" fill="none" />
          <path d="M40 68 L90 35 L140 100 L190 68 L240 35" stroke="#b6717d" stroke-width="3" fill="none" />
          <path d="M40 100 L90 100 L140 68 M190 35 L240 100" stroke="#b85e36" stroke-width="3" fill="none" />
          <text x="9" y="39">#1</text><text x="9" y="72">#2</text><text x="9" y="104">#3</text><text x="126" y="140">Year →</text>
        {:else if design.type==='bars'}
          <path d="M30 15 V115 H254" fill="none" stroke="#bcb2a7" />
          {#each [60,40,25,80,55,35,65,50,30] as h,i}<rect x={44+i*23+Math.floor(i/3)*7} y={115-h} width="17" height={h} fill={['#742e42','#b6717d','#b85e36'][i%3]} />{/each}
          <text x="55" y="135">Year 1</text><text x="134" y="135">Year 2</text><text x="212" y="135">Year 3</text>
        {:else if design.type==='network'}
          <path d="M70 42 L170 28 L221 90 L111 110 Z M70 42 L221 90 M170 28 L111 110" stroke="#d2b1b8" stroke-width="3" fill="none" />
          <path d="M70 42 L111 110" stroke="#742e42" stroke-width="8" />
          {#each [[70,42,19],[170,28,12],[221,90,15],[111,110,22]] as point,i}<circle cx={point[0]} cy={point[1]} r={point[2]} fill={['#742e42','#b6717d','#b85e36','#c99e76'][i]} />{/each}
          <text x="15" y="25">Genres</text>
        {:else if design.type==='chord'}
          <path d="M110 30 Q140 75 184 100 L173 110 Q140 75 97 37 Z" fill="#742e42" opacity=".5" />
          <path d="M177 30 Q140 75 96 100 L105 110 Q140 75 187 37 Z" fill="#b6717d" opacity=".5" />
          <path d="M188 51 Q140 75 100 51 L95 59 Q140 75 191 62 Z" fill="#b85e36" opacity=".5" />
          <path d="M110 30 A50 50 0 0 1 167 28" stroke="#742e42" stroke-width="10" fill="none" />
          <path d="M177 34 A50 50 0 0 1 188 86" stroke="#b6717d" stroke-width="10" fill="none" />
          <path d="M183 100 A50 50 0 0 1 123 119" stroke="#b85e36" stroke-width="10" fill="none" />
          <path d="M108 111 A50 50 0 0 1 95 51" stroke="#c99e76" stroke-width="10" fill="none" />
          <text x="121" y="12">Drama</text><text x="200" y="68">Comedy</text><text x="128" y="141">Romance</text><text x="35" y="73">Family</text>
        {/if}
      </svg>
      <p>{design.encoding}</p><p class="comparison">{design.reason}</p>
    </article>
  {/each}
</div>
<p class="method">These are conceptual sketches with illustrative marks, not charts of the dataset. The implemented charts above use the actual CSV.</p>
<style>
  .sketch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}.sketch{border:1px solid var(--line);padding:20px;border-radius:6px;background:var(--paper);}.sketch-title{display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:600;min-height:32px;}em{font-style:normal;color:var(--wine);font-size:9px;letter-spacing:1px;white-space:nowrap;}svg{width:100%;margin:10px 0;}svg text{font-size:10px;fill:#80746a;}.sketch p{font-size:12px;line-height:1.7;color:#625853;}.comparison{border-top:1px solid var(--line);padding-top:12px;}@media(max-width:850px){.sketch-grid{grid-template-columns:repeat(2,1fr);}}@media(max-width:540px){.sketch-grid{grid-template-columns:1fr;}}
</style>
