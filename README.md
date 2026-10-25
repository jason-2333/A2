# Summer Movies — CSCI 5609 A2 Interactive Analysis

SvelteKit + TypeScript + D3. This A2 repository continues the A1 project: the
earlier pages stay at `src/routes/A0` and `src/routes/A1`, and the assignment is at
`src/routes/A2/+page.svelte`. The root page also renders A2.

- Live demo: https://jason-2333.github.io/A2/A2/
- Repository: https://github.com/jason-2333/A2
- Instructions: https://github.com/UMN-CSCI5609/Assignments-Instructions/tree/main/A2-Analysis
- Report (PDF submitted on Canvas): `output/A2-Interactive-Analysis-Report.pdf`

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173/A2.

```sh
npm run check
npm run build
npm run preview
```

The static build defaults to base `/A2` (preview at http://localhost:4173/A2/A2/).
The GitHub Actions workflow derives `BASE_PATH` from the repository name.

## Part 1 — template tasks

| Task | Where |
|---|---|
| tip1 click interaction (details panel on the right) | `src/lib/Scatter.svelte` `handleMovieClick` |
| tip2 line in the line chart | `src/lib/Line.svelte` `lineGenerator` |
| tip3 brush on the line chart → filters the scatter plot | `src/lib/Line.svelte` `handleBrush` |
| tip4 x / y / size dropdowns | `src/routes/A2/+page.svelte` selectors |

Additions: `NA` values are parsed as `null` (`src/lib/movies.ts`) and skipped only
when the attribute is encoded; large circles are drawn first so small ones stay
clickable; brush ranges snap to whole years; a "log X" toggle helps with
heavily skewed `num_votes`.

## Part 4 — self-designed multi-view visualization

"What earns a summer movie an audience?" Three cross-filtered views of IMDb vote
counts: genre bars (`GenreAttention.svelte`), a log-scale strip plot of every
title by format (`VotesStrip.svelte`), and decade bars (`DecadeAttention.svelte`).
Click a genre or decade to filter the other views, toggle formats in the legend,
switch between median and total votes, and hover dots for titles.
Shared filtering logic lives in `src/lib/attention.ts`.

## Report

`report/report.html` is the source of the PDF; `screenshots/` holds the figures,
captured from the running site with headless Chrome.
