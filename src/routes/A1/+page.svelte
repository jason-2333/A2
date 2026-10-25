<script lang="ts">
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import type { TMovie } from '../../types';
  import Bar from '$lib/Bar.svelte';
  import Annual from '$lib/Annual.svelte';
  import Matrix from '$lib/Matrix.svelte';
  import Sketches from '$lib/Sketches.svelte';
  import { parseMovie, genreCounts } from '$lib/movies';

  let movies: TMovie[] = $state([]);
  let loading = $state(true);
  let error = $state('');
  let showSketches = $state(false);
  const years = $derived(movies.filter(m => m.year).map(m => m.year!.getFullYear()));
  const genres = $derived(genreCounts(movies));
  const yearRange = $derived(d3.extent(years));
  async function loadCsv() {
    loading = true;
    error = '';
    try {
      movies = await d3.csv(`${base}/summer_movies.csv`, parseMovie);
      if (!movies.length) throw new Error('The dataset is empty.');
      console.log('Loaded CSV Data:', $state.snapshot(movies));
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Unable to load the movie dataset.';
    } finally {
      loading = false;
    }
  }
  onMount(loadCsv);
</script>

<svelte:head>
  <title>Summer, on Screen — A1 Visual Encoding</title>
  <meta name="description" content="Explore 899 summer-titled movies through genre distribution, annual top-three rankings, and all-genre co-occurrence." />
</svelte:head>

<div class="site">
  <header class="masthead">
    <a class="brand" href="{base}/"><span class="brand-mark" aria-hidden="true">S<span>☼</span></span>SUMMER, ON SCREEN</a>
    <nav aria-label="Page sections"><a href="#distribution">The collection</a><a href="#annual">Through the years</a><a href="#connections">Genre connections</a></nav>
    <span class="course-tag">CSCI 5609 <span>/</span> A1</span>
  </header>
  <main>
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> A STUDY IN VISUAL ENCODING</p>
        <h1 id="page-title">A season in the title.<br />A world of <em>stories.</em></h1>
        <p class="intro">What do movies with “summer” in their title have in common? Explore the genres, their changing popularity, and the connections between them.</p>
        <a class="explore-link" href="#distribution">Explore the collection <span aria-hidden="true">↘</span></a>
      </div>
      <div class="collection-card" aria-hidden="true">
        <div class="card-top"><span>THE SUMMER COLLECTION</span><span>VOL. 01</span></div>
        <div class="sun-art"><div class="sun"></div><div class="horizon h1"></div><div class="horizon h2"></div><div class="horizon h3"></div></div>
        <div class="card-bottom"><span>SUMMER<br /><em>on screen.</em></span><small>1946 — 2024<br />AN IMDb EXPLORATION</small></div>
      </div>
    </section>
    <div class="stats" aria-label="Dataset summary">
      <div><strong>{loading ? '…' : movies.length.toLocaleString()}</strong><span>SUMMER-TITLED MOVIES</span></div>
      <div><strong>{loading ? '…' : genres.length}</strong><span>DISTINCT GENRES</span></div>
      <div><strong>{loading ? '…' : `${yearRange[0]}–${yearRange[1]}`}</strong><span>RELEASE YEARS</span></div>
      <div class="source-stat"><span class="source-dot"></span><p>One title, many genres.<br /><small>Source: IMDb · course dataset</small></p></div>
    </div>

    {#if loading || error}<div hidden><span id="distribution"></span><span id="annual"></span><span id="connections"></span></div>{/if}
    {#if error}
      <div class="load-status" role="alert"><h2>The collection could not be loaded.</h2><p>{error}</p><button onclick={loadCsv}>Try again</button></div>
    {:else if loading}
      <div class="load-status" role="status">Loading the summer movie collection…</div>
    {:else}
      <section id="distribution" class="section" aria-labelledby="distribution-title">
        <div class="section-head"><div class="section-number">01</div><div><p class="eyebrow">THE BIG PICTURE</p><h2 id="distribution-title">Which genres tell summer stories?</h2><p>Every genre in the collection, ordered by number of movies.</p></div><span class="chart-tag">GENRE DISTRIBUTION</span></div>
        <div class="chart-card"><Bar {movies} /><p class="method">A title can have up to three genres, so it can contribute to several bars. All {movies.length} titles are included; 18 titles have no known genre and do not contribute to genre counts.</p></div>
        <div class="section-note"><span>READING THE COLLECTION</span><p>Drama leads with {genres[0]?.[1]} titles, followed by Comedy ({genres[1]?.[1]}) and Romance ({genres[2]?.[1]}). These are movies with “summer” in the title, rather than all films released during summer.</p></div>
      </section>
      <section id="annual" class="section" aria-labelledby="annual-title">
        <div class="section-head"><div class="section-number">02</div><div><p class="eyebrow">QUESTION ONE · CHANGE OVER TIME</p><h2 id="annual-title">The top three never stand still.</h2><p>How do the annual top three genres change over time?</p></div><span class="chart-tag">ANNUAL RANK HEATMAP</span></div>
        <div class="chart-card"><Annual {movies} /></div>
      </section>
      <section id="connections" class="section" aria-labelledby="connections-title">
        <div class="section-head"><div class="section-number">03</div><div><p class="eyebrow">QUESTION TWO · SHARED STORIES</p><h2 id="connections-title">Genres rarely travel alone.</h2><p>Which genres tend to appear together in the same movie?</p></div><span class="chart-tag">CO-OCCURRENCE MATRIX</span></div>
        <div class="chart-card"><Matrix {movies} /></div>
      </section>
      <section id="designs" class="section design-section" aria-labelledby="design-title">
        <div class="section-head"><div class="section-number">04</div><div><p class="eyebrow">BEHIND THE CHARTS</p><h2 id="design-title">Six sketches. Two choices.</h2><p>Alternative encodings and the reasoning behind each selected design.</p></div><button class="outline-button" aria-expanded={showSketches} aria-controls="design-sketches" onclick={() => showSketches = !showSketches}>{showSketches ? 'Close notebook −' : 'Open design notebook +'}</button></div>
        {#if showSketches}<div id="design-sketches"><Sketches /></div>{/if}
      </section>
    {/if}
    <footer><div><a class="footer-brand" href="#page-title">Summer, on Screen</a><p>CSCI 5609 · A1 Visual Encoding</p></div><div class="footer-links"><a href="{base}/summer_movies.csv" download>Download the data ↗</a><a href="https://github.com/UMN-CSCI5609/Assignments-Instructions/tree/main/A1-Visual-Encoding" target="_blank" rel="noreferrer">Assignment & source ↗</a><a href="{base}/A0/">A0 exercise ↗</a></div><p class="data-note">IMDb non-commercial course dataset. Missing numeric values remain unknown. Genre counts describe this collection only.</p></footer>
  </main>
</div>

<style>
  :global(:root){--paper:#faf8f3;--wine:#742e42;--ink:#302a27;--muted:#7c746e;--line:#e4dfd6;--serif:Georgia,'Times New Roman',serif;}
  :global(html){scroll-behavior:smooth;scroll-padding-top:28px;background:var(--paper);}
  :global(body){margin:0;color:var(--ink);font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;}
  :global(*){box-sizing:border-box;} :global(a){color:inherit;} :global(button),:global(select){font:inherit;cursor:pointer;}
  :global(button:focus-visible),:global(a:focus-visible),:global(select:focus-visible){outline:2px solid #b85e36;outline-offset:4px;}
  .site{max-width:1440px;margin:0 auto;padding:0 64px;}.masthead{height:95px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:20px;}.brand{font-size:12px;font-weight:700;letter-spacing:1.5px;text-decoration:none;display:flex;gap:12px;align-items:center;}.brand-mark{font-family:var(--serif);font-size:32px;color:var(--wine);line-height:1;position:relative;}.brand-mark span{position:absolute;font-size:19px;left:14px;top:-8px;}
  nav{display:flex;gap:28px;}nav a{font-size:12px;text-decoration:none;color:#776e67;}nav a:hover{color:var(--wine);}.course-tag{font-size:11px;letter-spacing:1px;color:#776e67;white-space:nowrap;}.course-tag span{padding:0 8px;color:#bcb3a9;}
  .hero{display:grid;grid-template-columns:1.6fr 1fr;gap:72px;padding:67px 0 55px;align-items:center;}.eyebrow{font-size:10px;letter-spacing:1.8px;font-weight:600;color:var(--wine);margin:0 0 16px;display:flex;align-items:center;gap:9px;}.hero .eyebrow span{width:6px;height:6px;border-radius:50%;background:#b85e36;}h1{font-family:var(--serif);font-size:clamp(42px,4.7vw,67px);font-weight:400;line-height:1.13;letter-spacing:-2.4px;margin:20px 0 24px;}h1 em{color:var(--wine);font-weight:400;}.intro{max-width:450px;line-height:1.85;font-size:14px;color:#7b7067;margin-bottom:28px;}.explore-link{display:inline-flex;gap:35px;padding-bottom:9px;border-bottom:1px solid var(--wine);text-decoration:none;color:var(--wine);font-size:12px;}.explore-link span{font-size:18px;}
  .collection-card{background:#742e42;color:#f5e5d7;padding:24px 25px 22px;border-radius:4px;max-width:365px;width:100%;justify-self:end;transform:rotate(2deg);box-shadow:7px 9px 0 #ede7dc;}.card-top{display:flex;justify-content:space-between;letter-spacing:1.5px;font-size:8px;border-bottom:1px solid #b8757b;padding-bottom:13px;}.sun-art{height:192px;overflow:hidden;position:relative;margin:8px 0 14px;}.sun{width:116px;height:116px;border-radius:100%;background:#efba80;position:absolute;left:50%;top:22px;transform:translateX(-50%);}.horizon{position:absolute;border:1px solid #e2a380;border-radius:50%;width:410px;height:180px;left:50%;transform:translateX(-50%);background:#742e42;}.h1{top:107px;}.h2{top:129px;}.h3{top:151px;}.card-bottom{display:flex;justify-content:space-between;align-items:flex-end;}.card-bottom>span{font-family:var(--serif);font-size:32px;line-height:1;letter-spacing:1px;}.card-bottom em{font-size:26px;letter-spacing:0;}.card-bottom small{font-size:8px;line-height:1.9;letter-spacing:1px;text-align:right;}
  .stats{display:grid;grid-template-columns:1fr .85fr 1.1fr 1.15fr;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:25px 0;margin-bottom:12px;}.stats>div{padding:0 27px;border-right:1px solid var(--line);}.stats>div:first-child{padding-left:0;}.stats>div:last-child{border:0;}.stats strong{font-family:var(--serif);font-size:34px;font-weight:400;display:block;margin-bottom:9px;letter-spacing:-1px;}.stats div>span:not(.source-dot){font-size:9px;color:#8b7e74;letter-spacing:1.4px;}.source-stat{display:flex;align-items:center;gap:12px;}.source-dot{width:7px;height:7px;background:#a67758;border-radius:50%;flex-shrink:0;}.source-stat p{font-size:12px;line-height:1.7;}.source-stat small{color:#94867a;font-size:10px;}
  .section{padding-top:57px;}.section-head{display:flex;gap:18px;align-items:flex-start;margin-bottom:24px;}.section-number{font-family:var(--serif);font-size:23px;color:#bca794;border:1px solid #ded4c7;border-radius:50%;width:43px;height:43px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:5px;}.section-head .eyebrow{margin-bottom:8px;font-size:9px;letter-spacing:1.5px;}h2{font-family:var(--serif);font-size:31px;font-weight:400;letter-spacing:-.7px;margin:0 0 10px;}.section-head p:not(.eyebrow){font-size:12px;color:#84776d;margin:0;line-height:1.6;}.chart-tag{margin-left:auto;align-self:center;font-size:8px;letter-spacing:1px;border:1px solid var(--line);padding:8px 11px;border-radius:3px;color:#9b8675;white-space:nowrap;}.chart-card{background:#fffdf9;border:1px solid var(--line);border-radius:7px;padding:27px 26px 20px;}
  :global(.chart-scroll){overflow-x:auto;padding:8px 0;}:global(.chart-readout){display:flex;gap:15px;align-items:center;flex-wrap:wrap;padding:13px 16px;background:#f4f0e9;border-radius:4px;min-height:44px;font-size:11px;margin-top:15px;}:global(.chart-readout strong){font-weight:600;color:var(--wine);}:global(.chart-readout span){color:#837369;}:global(.method){font-size:11px;color:#8c7d71;line-height:1.8;margin:15px 0 0;}:global(.chart-controls){display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:22px;}:global(select){border:1px solid var(--line);background:#fffdf9;border-radius:4px;padding:7px 10px;color:#564a43;font-size:12px;}:global(.text-button){background:none;border:0;color:var(--wine);text-decoration:underline;font-size:11px;}:global(.segmented){display:flex;border:1px solid var(--line);border-radius:4px;overflow:hidden;}:global(.segmented button){border:0;background:transparent;color:#7c7067;padding:10px 15px;font-size:11px;}:global(.segmented button.active){background:var(--wine);color:#fffaf0;}
  :global(.insight){border-top:1px solid var(--line);margin-top:23px;padding:20px 0 0;display:grid;grid-template-columns:155px 1fr;gap:15px;}:global(.insight-label){font-size:9px;letter-spacing:1.2px;color:var(--wine);font-weight:600;padding-top:4px;}:global(.insight p){font-size:12px;line-height:1.85;color:#6d6056;margin:0;}.section-note{display:grid;grid-template-columns:190px 1fr;gap:20px;padding:19px 4px 0;}.section-note span{font-size:9px;color:var(--wine);letter-spacing:1px;padding-top:4px;}.section-note p{margin:0;font-size:12px;color:#7b6b5e;line-height:1.8;}.outline-button{margin-left:auto;align-self:center;background:none;border:1px solid #b89b89;border-radius:4px;padding:12px 17px;font-size:11px;color:var(--wine);white-space:nowrap;}.design-section{padding-bottom:35px;}.load-status{padding:80px 20px;text-align:center;}.load-status button{background:var(--wine);color:white;padding:10px 20px;border:0;border-radius:4px;}
  footer{display:grid;grid-template-columns:1fr 1fr;gap:16px;border-top:1px solid var(--line);padding:32px 0 30px;margin-top:20px;}.footer-brand{font-family:var(--serif);font-size:23px;text-decoration:none;}footer p{font-size:10px;color:#9a8777;line-height:1.8;}.footer-links{display:flex;gap:18px;justify-content:flex-end;align-items:center;flex-wrap:wrap;}.footer-links a{font-size:10px;text-decoration:none;color:#74675d;}.data-note{grid-column:1/-1;margin:0;}
  @media(min-width:1440px){h1{font-size:67px;}}
  @media(max-width:1000px){.site{padding:0 30px;}.hero{gap:35px;}nav{gap:15px;}.course-tag{display:none;}.chart-tag{display:none;}.stats>div{padding:0 18px;}.stats strong{font-size:29px;}}
  @media(max-width:680px){.site{padding:0 20px;}.masthead{height:auto;min-height:85px;flex-direction:column;justify-content:center;padding:18px 0;gap:16px;}nav{gap:20px;}nav a{font-size:10px;}.hero{grid-template-columns:1fr;padding:42px 0 34px;gap:34px;}h1{font-size:43px;letter-spacing:-1.6px;}.collection-card{justify-self:center;max-width:300px;}.sun-art{height:160px;}.stats{grid-template-columns:1fr 1fr;gap:22px;}.stats>div{padding:0 14px;}.stats>div:nth-child(3){padding-left:0;}.stats>div:nth-child(2){border:0;}.stats strong{font-size:29px;}.stats div>span:not(.source-dot){font-size:8px;}.section{padding-top:38px;}h2{font-size:27px;}.section-head{gap:12px;}.section-number{width:34px;height:34px;font-size:18px;}.chart-card{padding:17px 14px;}:global(.insight){grid-template-columns:1fr;gap:8px;}.section-note{grid-template-columns:1fr;gap:8px;}.design-section .section-head{flex-wrap:wrap;}.outline-button{margin-left:46px;}footer{grid-template-columns:1fr;}.footer-links{justify-content:flex-start;}}
  @media(prefers-reduced-motion:reduce){:global(html){scroll-behavior:auto;}}
  @media print{.site{padding:0 15px;}nav,.explore-link,.outline-button{display:none;}.hero{padding:20px 0;}.collection-card{max-width:230px;}.section{break-inside:avoid;padding-top:20px;}.chart-card{padding:10px;}:global(.chart-scroll){overflow:visible;}:global(svg){min-width:0!important;}.masthead{height:50px;}footer{padding:10px 0;} }
</style>
