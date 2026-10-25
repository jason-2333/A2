<script lang="ts">
    import type { TMovie } from "../types";
    import * as d3 from "d3";

    type TProps = {
        movies: TMovie[];
        x: keyof TMovie; // for simplicity, we assume x
        y: keyof TMovie;
        size?: keyof TMovie;
        logX?: boolean; // log scale for a numeric x attribute (e.g. heavily skewed num_votes)
        width?: number;
        height?: number;
    };
    const { movies, x, y, size, logX = false, height = 500, width = 600 }: TProps = $props();

    let selectedMovie: TMovie | undefined = $state();

    const margin = {
        top: 15,
        bottom: 50,
        left: 30,
        right: 10,
    };
    const usableArea = $derived({
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
    });
    const sizeRange = [3, 15];

    // A few titles have unknown year or runtime (stored as null); they can't be placed on those axes.
    const hasValue = (movie: TMovie, attr: keyof TMovie | undefined) =>
        attr === undefined || (movie[attr] !== null && movie[attr] !== undefined);

    // Draw big circles first so the small ones on top of them stay clickable.
    const plotted = $derived.by(() => {
        const valid = movies.filter((d) => hasValue(d, x) && hasValue(d, y) && hasValue(d, size));
        if (!size || typeof valid[0]?.[size] != "number") return valid;
        return [...valid].sort((a, b) => (b[size] as number) - (a[size] as number));
    });

    function getScale(
        attrName: keyof TMovie,
        axis: "x" | "y" | "color" | "size",
        movies: TMovie[],
    ): ((value: any) => number | undefined) | null {
        if (movies.length == 0) {
            return null;
        }

        let range: number[] = [0, 0];
        if (axis == "x") {
            range = [usableArea.left, usableArea.right];
        } else if (axis == "y") {
            range = [usableArea.bottom, usableArea.top];
        } else if (axis == "size") {
            range = sizeRange;
        }

        if (typeof movies[0][attrName] == "string") {
            return d3
                .scaleBand()
                .domain(movies.map((d) => d[attrName] as string))
                .range(range as [number, number]);
        } else if (typeof movies[0][attrName] == "number" && axis == "x" && logX) {
            return d3
                .scaleLog()
                .domain(
                    d3.extent(movies, (d) => Math.max(1, d[attrName] as number)) as [
                        number,
                        number,
                    ],
                )
                .range(range)
                .nice();
        } else if (typeof movies[0][attrName] == "number") {
            return d3
                .scaleLinear()
                .domain(
                    d3.extent(movies, (d) => d[attrName] as number) as [
                        number,
                        number,
                    ],
                )
                .range(range);
        } else if (movies[0][attrName] instanceof Date) {
            // date
            return d3
                .scaleTime()
                .domain(
                    d3.extent(movies, (d) => d[attrName] as Date) as [
                        Date,
                        Date,
                    ],
                )
                .range(range);
        } else if (typeof movies[0][attrName] == "object") {
            // array
            let allValues = movies
                .map((d) => d[attrName] as string[])
                .reduce((acc, val) => acc.concat(val), []);
            return d3
                .scaleBand()
                .domain([...new Set(allValues)])
                .range(range as [number, number]);
        } else {
            return null;
        }
    }

    const xScale = $derived(getScale(x, "x", plotted));
    const yScale = $derived(getScale(y, "y", plotted));
    const sizeScale = $derived(size ? getScale(size, "size", plotted) : null);

    let xAxis: any = $state(),
        yAxis: any = $state();

    function updateAxis() {
        if (!xScale || !yScale) {
            return;
        }
        const axis = d3.axisBottom(xScale as any);
        if (logX && typeof plotted[0]?.[x] == "number") axis.ticks(6, "~s");
        d3.select(xAxis)
            .call(axis)
            .selectAll("text")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start");

        d3.select(yAxis).call(d3.axisLeft(yScale as any));
    }

    function handleMovieClick(movie: TMovie) {
        // tip1: update the selectedMovie variable
        if (selectedMovie == movie) {
            selectedMovie = undefined;
        } else {
            selectedMovie = movie;
        }
    }

    // Band scales return the start of a band; shift to its center.
    function position(scale: typeof xScale, value: any, fallback: number) {
        if (!scale) return fallback;
        const offset = "bandwidth" in scale ? (scale as any).bandwidth() / 2 : 0;
        return (scale(value) ?? fallback) + offset;
    }

    function formatValue(key: string, value: unknown) {
        if (value === null || value === undefined) return "unknown";
        if (value instanceof Date) return String(value.getFullYear());
        if (Array.isArray(value)) return value.length ? value.join(", ") : "unknown";
        if (key == "num_votes") return (value as number).toLocaleString("en-US");
        if (key == "runtime_minutes") return `${value} min`;
        return String(value);
    }

    $effect(() => {
        updateAxis();
    });
</script>

<div class="scatter">
    <svg {width} {height}>
        <g class="points">
            {#each plotted as movie (movie.tconst)}
                {#if x == "genres"}
                    {#each movie["genres"] as genre}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <circle
                            cx={position(xScale, genre, usableArea.left)}
                            cy={position(yScale, movie[y], usableArea.bottom)}
                            r={sizeScale && size ? sizeScale(movie[size]) : sizeRange[0]}
                            fill={movie == selectedMovie
                                ? "steelblue"
                                : "transparent"}
                            stroke="steelblue"
                            stroke-width="2"
                            opacity={movie == selectedMovie ? 1 : 0.5}
                            onclick={() => handleMovieClick(movie)}
                        />
                    {/each}
                {:else}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <circle
                        cx={position(xScale, logX && typeof movie[x] == "number" ? Math.max(1, movie[x]) : movie[x], usableArea.left)}
                        cy={position(yScale, movie[y], usableArea.bottom)}
                        r={sizeScale && size ? sizeScale(movie[size]) : sizeRange[0]}
                        fill={movie == selectedMovie ? "steelblue" : "transparent"}
                        stroke="steelblue"
                        stroke-width="2"
                        opacity={movie == selectedMovie ? 1 : 0.5}
                        onclick={() => handleMovieClick(movie)}
                    />
                {/if}
            {/each}
        </g>
        <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
        <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />
    </svg>
    <div class="selectedInfo">
        {#if selectedMovie}
            <strong>{selectedMovie.primary_title}</strong>
            <dl>
                {#each Object.entries(selectedMovie) as [key, value]}
                    <dt>{key}</dt>
                    <dd>{formatValue(key, value)}</dd>
                {/each}
            </dl>
            <button onclick={() => (selectedMovie = undefined)}>Clear selection</button>
        {:else}
            Click on a point to see details
        {/if}
    </div>
</div>

<style>
    /* add animation when the point transit */
    .points circle {
        transition:
            r 0.5s,
            cx 0.5s,
            cy 0.5s;
        cursor: pointer;
    }

    .scatter {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        flex-wrap: wrap;
    }

    svg {
        overflow: visible;
    }

    .selectedInfo {
        width: 250px; /* Set a fixed width for the div */
        color: #555;
        font-family: monospace;
        background-color: #f9f9f9;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        overflow: auto; /* Add scroll if the content overflows */
    }

    .selectedInfo strong {
        display: block;
        color: #222;
        margin-bottom: 6px;
    }

    dl {
        margin: 0 0 8px;
    }

    dt {
        color: #888;
        font-size: 11px;
        margin-top: 6px;
    }

    dd {
        margin: 0;
        word-break: break-word;
    }
</style>
