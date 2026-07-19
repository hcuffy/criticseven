import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from '../containers/Home'
import Movies from '../containers/Movies'
import { HOME, MOVIES } from './routes.json'

const AppRoutes = () => (
  <Routes>
    <Route path={HOME} element={<Home />} />
    <Route path={MOVIES} element={<Movies />} />
  </Routes>
)

export default AppRoutes
