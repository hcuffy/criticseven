import { TmdbMovie } from '../tmdbWrapper'
import axios from 'axios'

const Tmdb = new TmdbMovie(process.env.API_KEY)

export const getMovies = async (request, response) => {
  try {
    const movies = await Tmdb.getHomeMovies()
    response.send(movies)
    return
  } catch (error) {
    console.error(error)
  }
}
