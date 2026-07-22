export interface MovieSummary {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
}

export interface MovieList {
  page: number
  total_pages: number
  total_results: number
  results: MovieSummary[]
}

export interface MovieDetails {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  runtime: number | null
  tagline: string
  genres: Array<{ id: number; name: string }>
}

export interface MovieVideo {
  id: string
  key: string
  site: string
  type: string
  name: string
  official: boolean
}

export interface MovieVideos {
  id: number
  results: MovieVideo[]
}
