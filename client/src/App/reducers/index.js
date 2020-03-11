import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import { applyMovies } from '../components/movies/reducers'

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    moviesData: applyMovies
  })
}
