import { movieHandlers } from './reducerHandlers'
import { reducerActionHandler } from '../../../helpers/defaultHandlers'

const initialLoadState = {
  movies: []
}

export const applyMovies = (state = initialLoadState, action) => {
  return reducerActionHandler(state, action, movieHandlers)
}
