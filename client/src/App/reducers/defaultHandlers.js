const _ = require('lodash')

export const defaultStateUpdater = (state, action) => {
  return _.assign({}, state, action.payload)
}

export const reducerActionHandler = (state, action, handlers) => {
  const handler = handlers[action.type]

  if (handler) {
    return handler(state, action)
  } else {
    return state
  }
}
