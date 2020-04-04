import axios from 'axios'
import TmdbMovie from '../movieDBWrapper'
import {
	API_KEY, fakeCredits, fakeImageInfo, fakeMovie, fakeMovieList
} from './mockData'

jest.mock('axios')

describe('Should test the retrieval of required movie information', () => {
	test('should fetch popular movies', async() => {
		const response = {
			data: fakeMovieList
		}

		axios.get.mockResolvedValue(response)
		const Tmdb = new TmdbMovie(API_KEY)

		const popularMovies = await Tmdb.getPopularMovies()

		expect(popularMovies).toEqual(fakeMovieList)
	})
	test('should fetch latest movie', async() => {
		const response = {
			data: fakeMovie
		}

		axios.get.mockResolvedValue(response)
		const Tmdb = new TmdbMovie(API_KEY)

		const latestMovies = await Tmdb.getLatestMovies()

		expect(latestMovies).toEqual(fakeMovie)
	})

	test('should fetch upcoming movies', async() => {
		const response = {
			data: fakeMovieList
		}

		axios.get.mockResolvedValue(response)
		const Tmdb = new TmdbMovie(API_KEY)

		const upcomingMovies = await Tmdb.getUpcomingMovies()

		expect(upcomingMovies).toEqual(fakeMovieList)
	})

	test('should fetch movies that are now playing', async() => {
		const response = {
			data: fakeMovieList
		}

		axios.get.mockResolvedValue(response)
		const Tmdb = new TmdbMovie(API_KEY)

		const playingMovies = await Tmdb.getPlayingMovies()

		expect(playingMovies).toEqual(fakeMovieList)
	})

	test('should fetch details of a movie', async() => {
		const response = {
			data: fakeMovie
		}

		axios.get.mockResolvedValue(response)
		const Tmdb = new TmdbMovie(API_KEY)

		const movieDetails = await Tmdb.getMovieDetails()

		expect(movieDetails).toEqual(fakeMovie)
	})

	test('should fetch movie images', async() => {
		const response = {
			data: fakeImageInfo
		}

		axios.get.mockResolvedValue(response)
		const Tmdb = new TmdbMovie(API_KEY)

		const movieImage = await Tmdb.getMovieImages()

		expect(movieImage).toEqual(fakeImageInfo)
	})

	test('should fetch movie credits', async() => {
		const response = {
			data: fakeCredits
		}

		axios.get.mockResolvedValue(response)
		const Tmdb = new TmdbMovie(API_KEY)

		const movieCredit = await Tmdb.getMovieCredits()

		expect(movieCredit).toEqual(fakeCredits)
	})
})

