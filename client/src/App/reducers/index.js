import { combineReducers } from "redux";
import { applyMovies } from "./movies";

const rootReducer = combineReducers({
  moviesData: applyMovies
});

export default rootReducer;
