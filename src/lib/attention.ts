import * as d3 from 'd3';
import type { TMovie } from '../types';

export const FORMATS = ['movie', 'tvMovie', 'video'] as const;
export type TFormat = (typeof FORMATS)[number];

export const FORMAT_LABEL: Record<TFormat, string> = {
  movie: 'Theatrical movie',
  tvMovie: 'TV movie',
  video: 'Direct-to-video'
};

// Categorical slots 1-3 of the reference palette; validated all-pairs for CVD.
export const FORMAT_COLOR: Record<TFormat, string> = {
  movie: '#2a78d6',
  tvMovie: '#eb6834',
  video: '#1baf7a'
};

// Genres with fewer titles than this give unstable medians, so the bar chart leaves them out.
export const MIN_GENRE_TITLES = 10;

export type TAttentionFilter = {
  formats: TFormat[];
  genre: string | null;
  decade: number | null;
};

export const decadeOf = (movie: TMovie) => (movie.year ? Math.floor(movie.year.getFullYear() / 10) * 10 : null);

export function matches(movie: TMovie, filter: TAttentionFilter, ignore: 'genre' | 'decade' | null = null) {
  if (!filter.formats.includes(movie.title_type as TFormat)) return false;
  if (ignore !== 'genre' && filter.genre && !movie.genres.includes(filter.genre)) return false;
  if (ignore !== 'decade' && filter.decade !== null && decadeOf(movie) !== filter.decade) return false;
  return true;
}

export function voteSummary(movies: TMovie[]) {
  return {
    count: movies.length,
    median: d3.median(movies, (d) => d.num_votes) ?? 0,
    total: d3.sum(movies, (d) => d.num_votes)
  };
}

export const formatVotes = d3.format(',.0f');
export const formatCompact = (value: number) => (value >= 1000 ? d3.format('.3~s')(value).replace('G', 'B') : formatVotes(value));
