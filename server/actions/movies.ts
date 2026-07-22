import {NextFunction, Request, Response} from 'express'
import {
	toMovieCreditsDTO, toMovieDetailsDTO, toMovieImagesDTO, toMovieListDTO, toMovieVideosDTO
} from '../serializers'
import {TmdbMovie} from '../tmdb-wrapper'

const Tmdb = new TmdbMovie(process.env.API_KEY)

// TMDB ids are always positive integers. request.query.movieId is otherwise
// unknown-shaped (Express parses repeated query keys as an array, and an
// absent key as undefined) — String(request.query.movieId) on either of
// those produces a value like "undefined" or "1,2" that gets interpolated
// straight into the upstream URL (server/tmdb-wrapper/movie-db-wrapper.ts)
// with no validation at all.
function parseMovieId(value: unknown): string | null {
	return typeof value === 'string' && /^\d+$/.test(value) ? value : null
}

const INVALID_MOVIE_ID = {
	error: { code: 'INVALID_MOVIE_ID', message: 'movieId must be a numeric TMDB id' }
}

export const getPopular = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const popularMovies = await Tmdb.getPopularMovies()

		response.send(await toMovieListDTO(popularMovies))
	} catch (error) {
		next(error)
	}
}

export const getLatest = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const latestMovie = await Tmdb.getLatestMovies()

		response.send(await toMovieDetailsDTO(latestMovie))
	} catch (error) {
		next(error)
	}
}

export const getUpcoming = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const upcomingMovies = await Tmdb.getUpcomingMovies()

		response.send(await toMovieListDTO(upcomingMovies))
	} catch (error) {
		next(error)
	}
}

export const getDetails = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const movieId = parseMovieId(request.query.movieId)

		if (!movieId) {
			response.status(400).json(INVALID_MOVIE_ID)
			return
		}

		const movieDetails = await Tmdb.getMovieDetails(movieId)

		response.send(await toMovieDetailsDTO(movieDetails))
	} catch (error) {
		next(error)
	}
}

export const getCredits = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const movieId = parseMovieId(request.query.movieId)

		if (!movieId) {
			response.status(400).json(INVALID_MOVIE_ID)
			return
		}

		const movieCredits = await Tmdb.getMovieCredits(movieId)

		response.send(toMovieCreditsDTO(movieCredits))
	} catch (error) {
		next(error)
	}
}

export const getNowPlaying = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const nowPlaying = await Tmdb.getPlayingMovies()

		response.send(await toMovieListDTO(nowPlaying))
	} catch (error) {
		next(error)
	}
}

export const getImages = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const movieId = parseMovieId(request.query.movieId)

		if (!movieId) {
			response.status(400).json(INVALID_MOVIE_ID)
			return
		}

		const movieImages = await Tmdb.getMovieImages(movieId)

		response.send(toMovieImagesDTO(movieImages))
	} catch (error) {
		next(error)
	}
}

export const getVideos = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const movieId = parseMovieId(request.query.movieId)

		if (!movieId) {
			response.status(400).json(INVALID_MOVIE_ID)
			return
		}

		const movieVideos = await Tmdb.getMovieVideos(movieId)

		response.send(toMovieVideosDTO(movieVideos))
	} catch (error) {
		next(error)
	}
}
