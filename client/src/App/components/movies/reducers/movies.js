import { movieHandlers } from './reducerHandlers'
import { reducerActionHandler } from '../../../reducers/defaultHandlers.js'

const initialLoadState = {
  movies: []
}

export const applyMovies = (state = initialLoadState, action) => {
  return reducerActionHandler(state, action, movieHandlers)
}
