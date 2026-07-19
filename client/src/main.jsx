import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { createLogger } from 'redux-logger'
import App from './App/index'
import createRootReducer from './App/reducers/index'
import './i18n'
import './index.css'

const logger = createLogger({
  level: 'info',
  collapsed: true
})

const store = configureStore({
  reducer: createRootReducer(),
  middleware: getDefaultMiddleware =>
    import.meta.env.DEV ? getDefaultMiddleware().concat(logger) : getDefaultMiddleware()
})

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
