import {Request, Response} from 'express'
import {TmdbMovie} from '../tmdbWrapper'

const Tmdb = new TmdbMovie(process.env.API_KEY)

export const getPopular = async(request: Request, response: Response) => {
	try {
		const popularMovies = await Tmdb.getPopularMovies()

		response.send(popularMovies)
	} catch (error) {
		console.error(error)
	}
}

export const getLatest = async(request: Request, response: Response) => {
	try {
		const latestMovies = await Tmdb.getLatestMovies()

		response.send(latestMovies)
	} catch (error) {
		console.error(error)
	}
}

export const getUpcoming = async(request: Request, response: Response) => {
	try {
		const upcomingMovies = await Tmdb.getUpcomingMovies()

		response.send(upcomingMovies)
	} catch (error) {
		console.error(error)
	}
}

export const getDetails = async(request: Request, response: Response) => {
	try {
		const movieDetails = await Tmdb.getMovieDetails(String(request.query.movieId))

		response.send(movieDetails)
	} catch (error) {
		console.error(error)
	}
}

export const getCredits = async(request: Request, response: Response) => {
	try {
		const movieCredits = await Tmdb.getMovieCredits(String(request.query.movieId))

		response.send(movieCredits)
	} catch (error) {
		console.error(error)
	}
}

export const getNowPlaying = async(request: Request, response: Response) => {
	try {
		const nowPlaying = await Tmdb.getPlayingMovies()

		response.send(nowPlaying)
	} catch (error) {
		console.error(error)
	}
}

export const getImages = async(request: Request, response: Response) => {
	try {
		const movieImages = await Tmdb.getMovieImages(String(request.query.movieId))

		response.send(movieImages)
	} catch (error) {
		console.error(error)
	}
}
