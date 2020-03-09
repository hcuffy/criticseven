import { GET_MOVIES } from '../constants'

export const getMovies = () => dispatch => {
  const movies = { data: 'holder actions' }

  dispatch({
    type: GET_MOVIES,
    payload: movies
  });
}
