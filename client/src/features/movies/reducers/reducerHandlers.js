import { actions } from '../constants'
import { defaultStateUpdater } from '../../../helpers/defaultHandlers'

export const movieHandlers = {
  [actions.GET_MOVIES]: defaultStateUpdater
}
