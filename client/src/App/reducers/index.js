import { combineReducers } from '@reduxjs/toolkit'
import { applyMovies } from '../../features/movies/reducers'

export default function createRootReducer() {
  return combineReducers({
    moviesData: applyMovies
  })
}
