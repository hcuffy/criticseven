import { MovieDocument } from '../database/models/movie'

export interface MoviePublicDTO {
	id: string
	title: string
	trailerUrl: string | null
}

// metadata is an opaque upstream (TMDB) blob cached for internal matching,
// not a curated response shape — it stays server-side, same allowlist
// reasoning as everything else in this file.
export function toMoviePublicDTO(movie: MovieDocument): MoviePublicDTO {
	return {
		id: movie.id,
		title: movie.title,
		trailerUrl: movie.trailerUrl
	}
}
