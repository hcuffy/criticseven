import express from 'express'
import { getMovies } from '../actions'
const router = express.Router()

router.get('/', getMovies)
//router.get('/movies', getMovies)

export default router
