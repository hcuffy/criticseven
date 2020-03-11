import { actions } from '../constants'
import { defaultStateUpdater } from '../../../reducers/defaultHandlers'

export const movieHandlers = {
  [actions.GET_MOVIES]: defaultStateUpdater
}
