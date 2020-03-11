import React from 'react'
import { render } from 'react-dom'
import App from './App/index'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import { createHashHistory } from 'history'
import thunk from 'redux-thunk'
import { createLogger } from 'redux-logger'
import createRootReducer from './App/reducers/index'
import * as serviceWorker from './serviceWorker'
import './i18n'

const middleware = []
const logger = createLogger({
  level: 'info',
  collapsed: true
})

const history = createHashHistory()
const rootReducer = createRootReducer(history)

middleware.push(thunk)

if (process.env.NODE_ENV === 'development') {
  middleware.push(logger)
}

const createStoreWithMiddleware = applyMiddleware(...middleware)(createStore)

const store = createStoreWithMiddleware(
  rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)

render(
  <Provider store={store} history={history}>
    <App />
  </Provider>,
  document.getElementById('root')
)

serviceWorker.unregister()
