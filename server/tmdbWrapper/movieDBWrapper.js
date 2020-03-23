// @flow
import axios from 'axios'
import type { PopularMovieType } from './types'

const apiBaseURL: string = 'https://api.themoviedb.org/3'

export default class TmdbMovie {
  apiKey: string
  language: string

  constructor(apiKey: string, language: string = 'en-US') {
    this.apiKey = apiKey
    this.language = language
  }

  async getHomeMovies(): Promise<PopularMovieType> {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/discover/movie?api_key=${this.apiKey}&sort_by=popularity.desc`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }
}
