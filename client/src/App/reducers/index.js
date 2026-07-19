import { combineReducers } from '@reduxjs/toolkit'
import { applyMovies } from '../components/movies/reducers'

export default function createRootReducer() {
  return combineReducers({
    moviesData: applyMovies
  })
}
