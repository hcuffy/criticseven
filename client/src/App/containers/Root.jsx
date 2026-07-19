import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Navbar from './Navbar'
import Routes from '../routes'

export default function Root() {
  return (
    <Router>
      <Navbar />
      <Routes />
    </Router>
  )
}
