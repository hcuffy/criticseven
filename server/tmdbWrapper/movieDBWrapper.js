import axios from 'axios'

const apiBaseURL = 'https://api.themoviedb.org/3'

export default class TmdbMovie {
  constructor(apiKey, language = 'en-US') {
    this.apiKey = apiKey
    this.language = language
  }

  async getHomeMovies() {
    try {
      const movies = await axios.get(
        `${apiBaseURL}/discover/movie?api_key=${this.apiKey}&sort_by=popularity.desc`
      )

      return movies
    } catch (error) {
      console.error(error)
    }
  }
}
