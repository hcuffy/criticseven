import { actions } from './constants'
const axios = require('axios')

export const getMovies = () => async dispatch => {
  try {
    const { data } = await axios.get('/movies')
    dispatch({
      type: actions.GET_MOVIES,
      payload: { movies: data }
    })
  } catch (error) {
    console.error(error)
  }
}
