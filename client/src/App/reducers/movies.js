import { GET_MOVIES } from "../constants";
const _ = require("lodash");

const initialLoadState = {
  test: []
};

export const applyMovies = (state = initialLoadState, action) => {
  switch (action.type) {
    case GET_MOVIES: {
      return _.assign({}, state, action.payload);
    }
    default:
      return state;
  }
};
