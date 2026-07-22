import axios from 'axios'

const apiBaseURL = 'https://api.themoviedb.org/3'

// Errors propagate to the route handlers, which forward them to the central
// error middleware — no catch-and-swallow here (it used to hang requests and
// dump axios errors, api_key included, to the console).
export default class TmdbMovie {
  apiKey: string | undefined

  language: string

  constructor(apiKey: string | undefined, language = 'en-US') {
    this.apiKey = apiKey
    this.language = language
  }

  async getPopularMovies() {
    const { data } = await axios.get(
      `${apiBaseURL}/discover/movie?api_key=${this.apiKey}&sort_by=popularity.desc`
    )

    return data
  }

  async getLatestMovies() {
    const { data } = await axios.get(
      `${apiBaseURL}/movie/latest?api_key=${this.apiKey}&language=${this.language}`
    )

    return data
  }

  async getUpcomingMovies(pageNumber = '1') {
    const { data } = await axios.get(
      `${apiBaseURL}/movie/upcoming?api_key=${this.apiKey}&language=${this.language}&page=${pageNumber}`
    )

    return data
  }

  async getPlayingMovies(pageNumber = '1') {
    const { data } = await axios.get(
      `${apiBaseURL}/movie/now_playing?api_key=${this.apiKey}&language=${this.language}&page=${pageNumber}`
    )

    return data
  }

  async getMovieDetails(movieId: string) {
    const { data } = await axios.get(
      `${apiBaseURL}/movie/${movieId}?api_key=${this.apiKey}&language=${this.language}`
    )

    return data
  }

  async getMovieImages(movieId: string) {
    const { data } = await axios.get(
      `${apiBaseURL}/movie/${movieId}/images?api_key=${this.apiKey}&language=${this.language}`
    )

    return data
  }

  async getMovieCredits(movieId: string) {
    const { data } = await axios.get(
      `${apiBaseURL}/movie/${movieId}/credits?api_key=${this.apiKey}&language=${this.language}`
    )

    return data
  }

  async getMovieVideos(movieId: string) {
    const { data } = await axios.get(
      `${apiBaseURL}/movie/${movieId}/videos?api_key=${this.apiKey}&language=${this.language}`
    )

    return data
  }
}
