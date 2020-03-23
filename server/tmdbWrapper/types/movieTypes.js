// @flow
export type OneMovieType = {|
  +poster_path: string,
  +adult: boolean,
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

export type ImageDetailsType = {|
  +aspect_ratio: number,
  +file_path: string,
  +height: number,
  +iso_639_1: string,
  +vote_average: number,
  +vote_count: number,
  +width: number
|}

export type ProductionCompanyType = {|
  +id: number,
  +logo_path: string,
  +name: string,
  +origin_country: string
|}

export type ProductionCountryType = {|
  +iso_3166_1: string,
  +name: string
|}

export type SpokenLanguageType = {|
  +iso_639_1: string,
  +name: string
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
  +adult: boolean,
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
  +production_companies: $ReadOnlyArray<ProductionCompanyType>,
  +production_countries: $ReadOnlyArray<{}>,
  +release_date: string,
  +revenue: number,
  +runtime: number,
  +spoken_languages: $ReadOnlyArray<SpokenLanguageType>,
  +status: string,
  +tagline: string,
  +title: string,
  +video: boolean,
  +vote_average: number,
  +vote_count: number
|}

export type MovieImageType = {|
  +id: number,
  +backdrops: $ReadOnlyArray<ImageDetailsType>,
  +posters: $ReadOnlyArray<ImageDetailsType>
|}

export type MovieDetailsType = {|
  +adult: boolean,
  +backdrop_path: string,
  +belongs_to_collection: string | null,
  +budget: number,
  +genres: $ReadOnlyArray<{ id: number, name: string }>,
  +homepage: string,
  +id: number,
  +imdb_id: string,
  +original_language: string,
  +original_title: string,
  +overview: string,
  +popularity: number,
  +poster_path: string | null,
  +production_companies: $ReadOnlyArray<ProductionCompanyType>,
  +production_countries: $ReadOnlyArray<ProductionCountryType>,
  +release_date: string,
  +revenue: number,
  +runtime: number,
  +spoken_languages: $ReadOnlyArray<SpokenLanguageType>,
  +status: string,
  +tagline: string,
  +title: string,
  +video: boolean,
  +vote_average: number,
  +vote_count: number
|}
