// @flow
import axios from 'axios'
import type {
  LatestMovieType,
  MovieCreditsType,
  MovieDetailsType,
  MovieImageType,
  PlayingMovieType,
  PopularMovieType,
  UpcomingMovieType
} from './types'

const apiBaseURL: string = 'https://api.themoviedb.org/3'

export default class TmdbMovie {
  apiKey: string
  language: string

  constructor(apiKey: string, language: string = 'en-US') {
    this.apiKey = apiKey
    this.language = language
  }

  async getPopularMovies(): Promise<PopularMovieType> {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/discover/movie?api_key=${this.apiKey}&sort_by=popularity.desc`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getLatestMovies(): Promise<LatestMovieType> {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/latest?api_key=${this.apiKey}&language=${this.language}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getUpcomingMovies(pageNumber: string = '1'): Promise<UpcomingMovieType> {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/upcoming?api_key=${this.apiKey}&language=${this.language}&page=${pageNumber}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getPlayingMovies(pageNumber: string = '1'): Promise<PlayingMovieType> {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/now_playing?api_key=${this.apiKey}&language=${this.language}&page=${pageNumber}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getMovieDetails(movieId: number): Promise<MovieDetailsType> {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/{movie_id}?api_key=${this.apiKey}&language=${this.language}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getMovieImages(movieId: number): Promise<MovieImageType> {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/{movie_id}/images?api_key=${this.apiKey}&${this.language}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getMovieCredits(movieId: number): Promise<MovieCreditsType> {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/{movie_id}/credits?api_key=${this.apiKey}&${this.language}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }
}
