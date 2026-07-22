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

export interface AuthorSummary {
  username: string
  honestyScore: number
  isLowTrust: boolean
  isPhoneVerified: boolean
}

export interface OpinionSummary {
  id: string
  movieId: number
  author: AuthorSummary
  hypeLevel: number
  comment: string
  createdAt: string
}

export interface ReviewSummary {
  id: string
  movieId: number
  author: AuthorSummary
  plot: number
  acting: number
  writing: number
  score: number
  directing: number
  editing: number
  cinematography: number
  comment: string
  createdAt: string
}

export interface PaginatedList<T> {
  page: number
  totalPages: number
  totalResults: number
  results: T[]
}
