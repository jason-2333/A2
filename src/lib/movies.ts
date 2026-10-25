import type { DSVRowString } from 'd3';
import type { TMovie } from '../types';

function numberOrNull(value: string | undefined) {
  if (!value || value === 'NA' || value === '\\N') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parseMovie(row: DSVRowString): TMovie {
  const year = numberOrNull(row.year);
  return {
    tconst: row.tconst ?? '',
    title_type: row.title_type ?? '',
    primary_title: row.primary_title ?? '',
    original_title: row.original_title ?? '',
    simple_title: row.simple_title ?? '',
    year: year === null ? null : new Date(year, 0, 1),
    runtime_minutes: numberOrNull(row.runtime_minutes),
    average_rating: numberOrNull(row.average_rating) ?? 0,
    num_votes: numberOrNull(row.num_votes) ?? 0,
    genres: [...new Set((row.genres ?? '').split(',').map(g => g.trim()).filter(g => g && g !== 'NA' && g !== '\\N'))]
  };
}

export function genreCounts(movies: TMovie[]) {
  const counts = new Map<string, number>();
  for (const movie of movies) {
    for (const genre of movie.genres) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'));
}

export function annualRanks(movies: TMovie[]) {
  const years = new Map<number, TMovie[]>();
  for (const movie of movies) {
    if (!movie.year) continue;
    const year = movie.year.getFullYear();
    if (!years.has(year)) years.set(year, []);
    years.get(year)!.push(movie);
  }
  return [...years].sort((a, b) => a[0] - b[0]).map(([year, titles]) => ({
    year,
    total: titles.length,
    top: genreCounts(titles).slice(0, 3).map(([genre, count], index) => ({ genre, count, rank: index + 1 }))
  }));
}

export function cooccurrences(movies: TMovie[], genres: string[]) {
  const counts = new Map<string, number>();
  for (const movie of movies) {
    for (const a of movie.genres) {
      for (const b of movie.genres) {
        const key = `${a}|${b}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return genres.flatMap((a, row) => genres.map((b, col) => ({
    a, b, row, col, count: counts.get(`${a}|${b}`) ?? 0
  })));
}
