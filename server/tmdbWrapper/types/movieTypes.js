// @flow
export type OneMovieType = {|
  +poster_path: string,
  +adult: string,
  +overview: string,
  +release_date: string,
  +genre_ids: $ReadOnlyArray<number>,
  +id: number,
  +original_title: string,
  +original_language: string,
  +title: string,
  +backdrop_path: string,
  +popularity: number,
  +vote_count: number,
  +video: boolean,
  +vote_average: 5.91
|}

export type PopularMovieType = {|
  +page: number,
  +results: $ReadOnlyArray<OneMovieType>,
  +total_results: number,
  +total_pages: number
|}

export type PlayingMovieType = {|
  +page: number,
  +results: $ReadOnlyArray<OneMovieType>,
  +maximum: string,
  +minimum: string,
  +total_results: number,
  +total_pages: number
|}

export type UpcomingMovieType = {|
  +page: number,
  +results: $ReadOnlyArray<OneMovieType>,
  +dates: { maximum: number, minimum: string },
  +total_results: number,
  +total_pages: number
|}

export type LatestMovieType = {|
  +adult: false,
  +backdrop_path: string | null,
  +belongs_to_collection: string | null,
  +budget: 0,
  +genres: $ReadOnlyArray<{ id: number, name: string }>,
  +homepage: string,
  +id: number,
  +imdb_id: string,
  +original_language: string,
  +original_title: string,
  +overview: string,
  +popularity: 0,
  +poster_path: string,
  +production_companies: $ReadOnlyArray<{}>,
  +production_countries: $ReadOnlyArray<{}>,
  +release_date: string,
  +revenue: number,
  +runtime: number,
  +spoken_languages: $ReadOnlyArray<{}>,
  +status: string,
  +tagline: string,
  +title: string,
  +video: boolean,
  +vote_average: number,
  +vote_count: number
|}