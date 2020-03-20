import {TmdbMovie} from '../tmdbWrapper'

const Tmdb = new TmdbMovie(process.env.API_KEY)

export const getMovies = async(request, response) => {
	try {
		const movies = await Tmdb.getHomeMovies()

		response.send(movies)

		return
	} catch (error) {
		console.error(error)
	}
}
