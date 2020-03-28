import {TmdbMovie} from '../tmdbWrapper'

const Tmdb = new TmdbMovie(process.env.API_KEY)

export const getPopular = async(request, response) => {
	try {
		const popularMovies = await Tmdb.getPopularMovies()

		response.send(popularMovies)

		return
	} catch (error) {
		console.error(error)
	}
}

export const getLatest = async(request, response) => {
	try {
		const latestMovies = await Tmdb.getLatestMovies()

		response.send(latestMovies)

		return
	} catch (error) {
		console.error(error)
	}
}

export const getUpcoming = async(request, response) => {
	try {
		const upcomingMovies = await Tmdb.getUpcomingMovies()

		response.send(upcomingMovies)

		return
	} catch (error) {
		console.error(error)
	}
}

export const getDetails = async(request, response) => {
	try {
		const movieDetails = await Tmdb.getMovieDetails()

		response.send(movieDetails)

		return
	} catch (error) {
		console.error(error)
	}
}

export const getCredits = async(request, response) => {
	try {
		const movieCredits = await Tmdb.getMovieCredits()

		response.send(movieCredits)

		return
	} catch (error) {
		console.error(error)
	}
}

export const getNowPlaying = async(request, response) => {
	try {
		const nowPlaying = await Tmdb.getPlayingMovies()

		response.send(nowPlaying)

		return
	} catch (error) {
		console.error(error)
	}
}

export const getImages = async(request, response) => {
	try {
		const movieImages = await Tmdb.getMovieImages()

		response.send(movieImages)

		return
	} catch (error) {
		console.error(error)
	}
}

