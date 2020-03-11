import { actions } from './constants'

export const getMovies = () => dispatch => {
  const movies = { data: 'holder actions' }

  dispatch({
    type: actions.GET_MOVIES,
    payload: movies
  })
}
