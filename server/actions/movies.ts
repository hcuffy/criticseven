import {NextFunction, Request, Response} from 'express'
import {
	toMovieCreditsDTO, toMovieDetailsDTO, toMovieImagesDTO, toMovieListDTO
} from '../serializers'
import {TmdbMovie} from '../tmdb-wrapper'

const Tmdb = new TmdbMovie(process.env.API_KEY)

export const getPopular = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const popularMovies = await Tmdb.getPopularMovies()

		response.send(toMovieListDTO(popularMovies))
	} catch (error) {
		next(error)
	}
}

export const getLatest = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const latestMovie = await Tmdb.getLatestMovies()

		response.send(toMovieDetailsDTO(latestMovie))
	} catch (error) {
		next(error)
	}
}

export const getUpcoming = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const upcomingMovies = await Tmdb.getUpcomingMovies()

		response.send(toMovieListDTO(upcomingMovies))
	} catch (error) {
		next(error)
	}
}

export const getDetails = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const movieDetails = await Tmdb.getMovieDetails(String(request.query.movieId))

		response.send(toMovieDetailsDTO(movieDetails))
	} catch (error) {
		next(error)
	}
}

export const getCredits = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const movieCredits = await Tmdb.getMovieCredits(String(request.query.movieId))

		response.send(toMovieCreditsDTO(movieCredits))
	} catch (error) {
		next(error)
	}
}

export const getNowPlaying = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const nowPlaying = await Tmdb.getPlayingMovies()

		response.send(toMovieListDTO(nowPlaying))
	} catch (error) {
		next(error)
	}
}

export const getImages = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const movieImages = await Tmdb.getMovieImages(String(request.query.movieId))

		response.send(toMovieImagesDTO(movieImages))
	} catch (error) {
		next(error)
	}
}
