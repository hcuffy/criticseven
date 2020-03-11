import express from 'express'
import { getMovies } from '../actions'
const router = express.Router()

router.get('/', getMovies)

export default router
