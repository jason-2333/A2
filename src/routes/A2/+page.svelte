<script lang="ts">
    import * as d3 from "d3";
    import { base } from "$app/paths";
    import { Scatter, Line, GenreAttention, VotesStrip, DecadeAttention } from "$lib";
    import { onMount } from "svelte";
    import type { TMovie } from "../../types";
    import { parseMovie } from "$lib/movies";
    import {
        FORMATS,
        FORMAT_COLOR,
        FORMAT_LABEL,
        formatCompact,
        matches,
        voteSummary,
        type TAttentionFilter,
        type TFormat,
    } from "$lib/attention";

    // Reactive variable for storing the data
    let movies: TMovie[] = $state([]);
    let error = $state("");

    let yearRange: [Date, Date] | undefined = $state();

    function getYearCountArray(movies: TMovie[]) {
        // one title has an unknown year; it can't be placed on the timeline
        const counts = d3.rollups(
            movies.filter((d) => d.year),
            (v) => v.length,
            (d) => d.year!.getFullYear(),
        );
        // Convert to an array of { x, y } objects sorted by year in ascending order
        return counts
            .map(([year, count]) => ({ x: new Date(year, 0, 1), y: count }))
            .sort((a, b) => (a.x < b.x ? -1 : 1));
    }

    let yearCountArray = $derived(getYearCountArray(movies));

    type TAxisSelection = {
        x: keyof TMovie;
        y: keyof TMovie;
        size: keyof TMovie;
    };

    // tip4: axisSelection is a reactive variable that stores the axis selection
    let axisSelection: TAxisSelection = $state({
        x: "year",
        y: "average_rating",
        size: "num_votes",
    });
    let logX = $state(false);

    // Function to load the CSV
    async function loadCsv() {
        error = "";
        try {
            const csvUrl = `${base}/summer_movies.csv`;
            // all values are strings, so parseMovie converts numbers, years (Date) and genres (array); NA becomes null
            movies = await d3.csv(csvUrl, parseMovie);
            console.log("Loaded CSV Data:", $state.snapshot(movies));
        } catch (cause) {
            console.error("Error loading CSV:", cause);
            error = "Could not load the movie dataset.";
        }
    }
    // Call the loader when the component mounts
    onMount(loadCsv);

    // tip4: below are the derived stores for the options of the selectors
    const attrOptionsX = $derived(movies[0] ? Object.keys(movies[0]) : []);
    const attrOptionsY = $derived(
        movies[0] ? Object.keys(movies[0]).filter((d) => d != "genres") : [],
    );
    const attrOptionsS = $derived(
        movies[0] ? Object.keys(movies[0]).filter((d) => d != "genres") : [],
    );

    const scatterMovies = $derived(
        yearRange
            ? movies.filter(
                  (d) => d.year && d.year <= yearRange![1] && d.year >= yearRange![0],
              )
            : movies,
    );

    // ---- Part 4: audience attention explorer (cross-filtered views) ----
    let formats: TFormat[] = $state([...FORMATS]);
    let selectedGenre: string | null = $state(null);
    let selectedDecade: number | null = $state(null);
    let metric: "median" | "total" = $state("median");

    const filter: TAttentionFilter = $derived({
        formats,
        genre: selectedGenre,
        decade: selectedDecade,
    });
    const allVotes = $derived(d3.sum(movies, (d) => d.num_votes));
    const selection = $derived(movies.filter((m) => matches(m, filter)));
    const summary = $derived(voteSummary(selection));
    const topTen = $derived(
        [...selection].sort((a, b) => b.num_votes - a.num_votes).slice(0, 10),
    );
    const topTenShare = $derived(
        summary.total ? d3.sum(topTen, (d) => d.num_votes) / summary.total : 0,
    );

    function toggleFormat(format: TFormat) {
        formats = formats.includes(format)
            ? formats.filter((f) => f != format)
            : FORMATS.filter((f) => f == format || formats.includes(f));
    }

    function resetExplorer() {
        formats = [...FORMATS];
        selectedGenre = null;
        selectedDecade = null;
    }

    const pct = d3.format(".0%");
</script>

<svelte:head>
    <title>Summer Movies — A2 Interactive Analysis</title>
</svelte:head>

<div class="container">
    <header>
        <p class="eyebrow">CSCI 5609 · A2 Interactive Analysis</p>
        <h1>Summer Movies</h1>
    </header>

    {#if error}
        <p class="error" role="alert">{error} <button onclick={loadCsv}>Try again</button></p>
    {/if}

    <section id="dashboard">
        <h2>Part 1 · Multi-view dashboard</h2>
        <p>Here are {movies.length == 0 ? "..." : movies.length + " "} movies</p>
        {#if movies.length > 0}
            <div class="selectors">
                <!-- tip4: selectors binding data attributes to x axis, y axis, and size -->
                <label>
                    X Axis:
                    <select bind:value={axisSelection.x}>
                        {#each attrOptionsX as key}
                            <option value={key}>{key}</option>
                        {/each}
                    </select>
                </label>

                <label>
                    Y Axis:
                    <select bind:value={axisSelection.y}>
                        {#each attrOptionsY as key}
                            <option value={key}>{key}</option>
                        {/each}
                    </select>
                </label>

                <label>
                    Size:
                    <select bind:value={axisSelection.size}>
                        {#each attrOptionsS as key}
                            <option value={key}>{key}</option>
                        {/each}
                    </select>
                </label>
                <label title="Useful for skewed attributes such as num_votes">
                    <input type="checkbox" bind:checked={logX} /> log X
                </label>
                <span class="count">
                    showing {scatterMovies.length} movies{yearRange
                        ? ` released ${yearRange[0].getFullYear()}–${yearRange[1].getFullYear()}`
                        : ""}
                </span>
            </div>

            <Scatter
                movies={scatterMovies}
                x={axisSelection.x}
                y={axisSelection.y}
                size={axisSelection.size}
                {logX}
            />
            <br />

            <Line data={yearCountArray} bind:yearRange />
        {/if}
    </section>

    {#if movies.length > 0}
        <section id="attention">
            <h2>Part 4 · What earns a summer movie an audience?</h2>
            <p class="question">
                Audience attention (the number of IMDb votes) is extremely uneven. Is it
                driven by a movie's <strong>format</strong>, its <strong>genre</strong>, or
                its <strong>release era</strong>? Click a genre bar or a decade bar to
                filter the other views, and toggle formats in the legend. Hover a dot for
                the title.
            </p>

            <div class="controls">
                <div class="legend" role="group" aria-label="Formats">
                    {#each FORMATS as format}
                        <button
                            class="chip"
                            class:off={!formats.includes(format)}
                            aria-pressed={formats.includes(format)}
                            onclick={() => toggleFormat(format)}
                        >
                            <span class="swatch" style="background:{FORMAT_COLOR[format]}"></span>
                            {FORMAT_LABEL[format]}
                        </button>
                    {/each}
                </div>
                <div class="metric" role="group" aria-label="Bar metric">
                    <button class:active={metric == "median"} aria-pressed={metric == "median"} onclick={() => (metric = "median")}>Median votes</button>
                    <button class:active={metric == "total"} aria-pressed={metric == "total"} onclick={() => (metric = "total")}>Total votes</button>
                </div>
                <button class="reset" onclick={resetExplorer}>Reset</button>
            </div>

            <div class="summary" aria-live="polite">
                <div><strong>{summary.count}</strong><span>titles selected</span></div>
                <div><strong>{formatCompact(summary.median)}</strong><span>median votes</span></div>
                <div><strong>{allVotes ? pct(summary.total / allVotes) : "–"}</strong><span>of all votes</span></div>
                <div><strong>{pct(topTenShare)}</strong><span>of the selection's votes go to its top 10</span></div>
                <p class="filters">
                    {selectedGenre ?? "All genres"} · {selectedDecade !== null ? `${selectedDecade}s` : "all decades"} ·
                    {formats.length == FORMATS.length ? "all formats" : formats.map((f) => FORMAT_LABEL[f]).join(" + ") || "no format"}
                </p>
            </div>

            <div class="views">
                <div class="card genres">
                    <h3>{metric == "median" ? "Median" : "Total"} votes by genre</h3>
                    <p class="hint">Genres with ≥10 titles · click to filter</p>
                    <GenreAttention {movies} {filter} {metric} bind:selectedGenre />
                </div>
                <div class="stack">
                    <div class="card">
                        <h3>Every title's votes, split by format</h3>
                        <p class="hint">Colored = matches the genre and decade selection</p>
                        <VotesStrip {movies} {filter} />
                    </div>
                    <div class="card">
                        <h3>{metric == "median" ? "Median" : "Total"} votes by release decade</h3>
                        <p class="hint">Click a decade to filter</p>
                        <DecadeAttention {movies} {filter} {metric} bind:selectedDecade />
                    </div>
                </div>
            </div>
            <div class="top">
                <h3>Most-voted titles in the selection</h3>
                <ol>
                    {#each topTen as movie (movie.tconst)}
                        <li>
                            <span class="swatch" style="background:{FORMAT_COLOR[movie.title_type as TFormat]}"></span>
                            {movie.primary_title}
                            <span class="muted">({movie.year?.getFullYear() ?? "?"}) · {formatCompact(movie.num_votes)} votes · ★ {movie.average_rating}</span>
                        </li>
                    {/each}
                </ol>
            </div>
        </section>
    {/if}
</div>

<style>
    :global(html) {
        color-scheme: light;
    }
    :global(body) {
        margin: 0;
        background: #fff;
    }
    .container {
        width: min(1120px, calc(100vw - 32px));
        margin: 10px auto 60px;
        padding: 10px;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        color: #1f1e1c;
    }
    .eyebrow {
        margin: 0;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6b6a64;
    }
    h1 {
        margin: 4px 0 8px;
    }
    h2 {
        margin: 32px 0 6px;
        font-size: 20px;
        border-top: 1px solid #e3e1db;
        padding-top: 20px;
    }
    h3 {
        margin: 0;
        font-size: 14px;
    }
    .selectors {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        align-items: center;
        margin-bottom: 12px;
    }
    .count {
        color: #6b6a64;
        font-size: 13px;
    }
    #dashboard :global(svg.line) {
        overflow: visible;
    }
    #dashboard :global(.scatter) {
        margin-bottom: 40px; /* room for rotated x labels */
    }
    .question {
        max-width: 760px;
        line-height: 1.5;
    }
    .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin: 12px 0;
    }
    .legend,
    .metric {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }
    button {
        font: inherit;
        font-size: 13px;
        border: 1px solid #d8d6d0;
        background: #fff;
        border-radius: 999px;
        padding: 5px 12px;
        cursor: pointer;
    }
    button:hover {
        background: #f4f3ef;
    }
    .chip.off {
        color: #9a988f;
        text-decoration: line-through;
    }
    .chip.off .swatch {
        background: #d8d6d0 !important;
    }
    .metric button.active {
        background: #1f1e1c;
        color: #fff;
        border-color: #1f1e1c;
    }
    .swatch {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 4px;
        vertical-align: -1px;
    }
    .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 28px;
        align-items: baseline;
        padding: 12px 16px;
        background: #f7f6f2;
        border-radius: 8px;
    }
    .summary div {
        display: flex;
        flex-direction: column;
    }
    .summary strong {
        font-size: 22px;
        font-variant-numeric: tabular-nums;
    }
    .summary span,
    .filters {
        font-size: 12px;
        color: #6b6a64;
        max-width: 180px;
    }
    .filters {
        max-width: none;
        margin: 0;
        flex-basis: 100%;
    }
    .views {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 16px;
        align-items: flex-start;
    }
    .stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex: 1 1 600px;
        min-width: 0;
    }
    .card {
        border: 1px solid #e3e1db;
        border-radius: 8px;
        padding: 12px;
        background: #fff;
        min-width: 0;
    }
    .card.genres {
        flex: 0 1 424px;
    }
    .hint {
        margin: 2px 0 8px;
        font-size: 12px;
        color: #6b6a64;
    }
    .top ol {
        columns: 2 320px;
        font-size: 13px;
        padding-left: 20px;
    }
    .top li {
        margin-bottom: 4px;
        break-inside: avoid;
    }
    .muted {
        color: #6b6a64;
    }
    .error {
        color: #b3261e;
    }
</style>
