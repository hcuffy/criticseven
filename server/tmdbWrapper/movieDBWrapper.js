import axios from 'axios'

const apiBaseURL = 'https://api.themoviedb.org/3'

export default class TmdbMovie {
  constructor(apiKey, language = 'en-US') {
    this.apiKey = apiKey
    this.language = language
  }

  async getPopularMovies() {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/discover/movie?api_key=${this.apiKey}&sort_by=popularity.desc`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getLatestMovies() {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/latest?api_key=${this.apiKey}&language=${this.language}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getUpcomingMovies(pageNumber = '1') {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/upcoming?api_key=${this.apiKey}&language=${this.language}&page=${pageNumber}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getPlayingMovies(pageNumber = '1') {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/now_playing?api_key=${this.apiKey}&language=${this.language}&page=${pageNumber}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getMovieDetails(movieId) {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/${movieId}?api_key=${this.apiKey}&language=${this.language}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getMovieImages(movieId) {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/${movieId}/images?api_key=${this.apiKey}&language=${this.language}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }

  async getMovieCredits(movieId) {
    try {
      const { data } = await axios.get(
        `${apiBaseURL}/movie/${movieId}/credits?api_key=${this.apiKey}&language=${this.language}`
      )

      return data
    } catch (error) {
      console.error(error)
    }
  }
}
