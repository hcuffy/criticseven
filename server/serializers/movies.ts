/*
 * Response DTOs — explicit field allowlist per response type (see
 * "Standing Requirement — Data Minimization" in docs/plan).
 * Every field sent to the client is named here; anything TMDB adds
 * upstream is dropped unless deliberately allowlisted.
 */

type TmdbPayload = Record<string, unknown>

export interface MovieSummaryDTO {
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

export interface MovieDetailsDTO extends Omit<MovieSummaryDTO, 'genre_ids'> {
	runtime: number | null
	tagline: string
	genres: Array<{id: number, name: string}>
}

export interface MovieListDTO {
	page: number
	total_pages: number
	total_results: number
	results: MovieSummaryDTO[]
}

export interface CastMemberDTO {
	id: number
	name: string
	character: string
	profile_path: string | null
	order: number
}

export interface CrewMemberDTO {
	id: number
	name: string
	job: string
	department: string
	profile_path: string | null
}

export interface MovieCreditsDTO {
	id: number
	cast: CastMemberDTO[]
	crew: CrewMemberDTO[]
}

export interface MovieImageDTO {
	file_path: string
	width: number
	height: number
	aspect_ratio: number
}

export interface MovieImagesDTO {
	id: number
	backdrops: MovieImageDTO[]
	posters: MovieImageDTO[]
}

export function toMovieSummaryDTO(movie: TmdbPayload): MovieSummaryDTO {
	return {
		id: movie.id as number,
		title: movie.title as string,
		overview: movie.overview as string,
		poster_path: (movie.poster_path as string) ?? null,
		backdrop_path: (movie.backdrop_path as string) ?? null,
		release_date: movie.release_date as string,
		vote_average: movie.vote_average as number,
		vote_count: movie.vote_count as number,
		genre_ids: (movie.genre_ids as number[]) ?? []
	}
}

export function toMovieDetailsDTO(movie: TmdbPayload): MovieDetailsDTO {
	return {
		id: movie.id as number,
		title: movie.title as string,
		overview: movie.overview as string,
		poster_path: (movie.poster_path as string) ?? null,
		backdrop_path: (movie.backdrop_path as string) ?? null,
		release_date: movie.release_date as string,
		vote_average: movie.vote_average as number,
		vote_count: movie.vote_count as number,
		runtime: (movie.runtime as number) ?? null,
		tagline: (movie.tagline as string) ?? '',
		genres: (movie.genres as Array<{id: number, name: string}>) ?? []
	}
}

export function toMovieListDTO(payload: TmdbPayload): MovieListDTO {
	const results = (payload.results as TmdbPayload[]) ?? []

	return {
		page: payload.page as number,
		total_pages: payload.total_pages as number,
		total_results: payload.total_results as number,
		results: results.map(toMovieSummaryDTO)
	}
}

export function toMovieCreditsDTO(payload: TmdbPayload): MovieCreditsDTO {
	const cast = (payload.cast as TmdbPayload[]) ?? []

	const crew = (payload.crew as TmdbPayload[]) ?? []

	return {
		id: payload.id as number,
		cast: cast.map(member => ({
			id: member.id as number,
			name: member.name as string,
			character: member.character as string,
			profile_path: (member.profile_path as string) ?? null,
			order: member.order as number
		})),
		crew: crew.map(member => ({
			id: member.id as number,
			name: member.name as string,
			job: member.job as string,
			department: member.department as string,
			profile_path: (member.profile_path as string) ?? null
		}))
	}
}

function toMovieImageDTO(image: TmdbPayload): MovieImageDTO {
	return {
		file_path: image.file_path as string,
		width: image.width as number,
		height: image.height as number,
		aspect_ratio: image.aspect_ratio as number
	}
}

export function toMovieImagesDTO(payload: TmdbPayload): MovieImagesDTO {
	return {
		id: payload.id as number,
		backdrops: ((payload.backdrops as TmdbPayload[]) ?? []).map(toMovieImageDTO),
		posters: ((payload.posters as TmdbPayload[]) ?? []).map(toMovieImageDTO)
	}
}
