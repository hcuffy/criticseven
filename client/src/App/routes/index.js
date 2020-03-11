import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { HOME, MOVIES } from './routes.json'
import Home from '../containers/Home'
import Movies from '../containers/Movies'

export default () => (
  <Switch>
    {[
      <Route exact key="1" path={HOME} component={Home} />,
      <Route exact key="1" path={MOVIES} component={Movies} />
    ]}
  </Switch>
)
