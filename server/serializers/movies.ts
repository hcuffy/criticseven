/*
 * Response DTOs — explicit field allowlist per response type (see
 * "Standing Requirement — Data Minimization" in docs/plan).
 * Every field sent to the client is named here; anything TMDB adds
 * upstream is dropped unless deliberately allowlisted.
 *
 * poster_path/backdrop_path are resolved through server/lib/image-service.ts
 * (Phase 4) — they are full, ready-to-use image URLs here, not the raw
 * TMDB-relative paths TMDB itself returns.
 */

import { getBackdropUrl, getPosterUrl } from '../lib/image-service'

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

export interface MovieVideoDTO {
	id: string
	key: string
	site: string
	type: string
	name: string
	official: boolean
}

export interface MovieVideosDTO {
	id: number
	results: MovieVideoDTO[]
}

export async function toMovieSummaryDTO(movie: TmdbPayload): Promise<MovieSummaryDTO> {
	const [posterUrl, backdropUrl] = await Promise.all([
		getPosterUrl((movie.poster_path as string) ?? null),
		getBackdropUrl((movie.backdrop_path as string) ?? null)
	])

	return {
		id: movie.id as number,
		title: movie.title as string,
		overview: movie.overview as string,
		poster_path: posterUrl,
		backdrop_path: backdropUrl,
		release_date: movie.release_date as string,
		vote_average: movie.vote_average as number,
		vote_count: movie.vote_count as number,
		genre_ids: (movie.genre_ids as number[]) ?? []
	}
}

export async function toMovieDetailsDTO(movie: TmdbPayload): Promise<MovieDetailsDTO> {
	const [posterUrl, backdropUrl] = await Promise.all([
		getPosterUrl((movie.poster_path as string) ?? null),
		getBackdropUrl((movie.backdrop_path as string) ?? null)
	])

	return {
		id: movie.id as number,
		title: movie.title as string,
		overview: movie.overview as string,
		poster_path: posterUrl,
		backdrop_path: backdropUrl,
		release_date: movie.release_date as string,
		vote_average: movie.vote_average as number,
		vote_count: movie.vote_count as number,
		runtime: (movie.runtime as number) ?? null,
		tagline: (movie.tagline as string) ?? '',
		genres: (movie.genres as Array<{id: number, name: string}>) ?? []
	}
}

export async function toMovieListDTO(payload: TmdbPayload): Promise<MovieListDTO> {
	const results = (payload.results as TmdbPayload[]) ?? []

	return {
		page: payload.page as number,
		total_pages: payload.total_pages as number,
		total_results: payload.total_results as number,
		results: await Promise.all(results.map(toMovieSummaryDTO))
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

function toMovieVideoDTO(video: TmdbPayload): MovieVideoDTO {
	return {
		id: video.id as string,
		key: video.key as string,
		site: video.site as string,
		type: video.type as string,
		name: video.name as string,
		official: (video.official as boolean) ?? false
	}
}

// Movie.trailerUrl (the app's own field, docs/plan Phase 5 item 1) is the
// primary trailer source once something populates it; this stays as the
// fallback for movies that don't have one yet.
export function toMovieVideosDTO(payload: TmdbPayload): MovieVideosDTO {
	return {
		id: payload.id as number,
		results: ((payload.results as TmdbPayload[]) ?? []).map(toMovieVideoDTO)
	}
}
