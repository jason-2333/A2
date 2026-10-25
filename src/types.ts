export type TMovie = {
  num_votes: number;
  runtime_minutes: number | null;
  genres: string[];
  year: Date | null;
  average_rating: number;
  tconst: string;
  title_type: string;
  primary_title: string;
  original_title: string;
  simple_title: string;
};
