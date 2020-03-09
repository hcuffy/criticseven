import { GET_MOVIES } from "../constants";

const _ = require("lodash");

export function getMovies() {
  const movies = { data: "holder actions" };

  dispatch({
    type: GET_MOVIES,
    payload: movies
  });
}
