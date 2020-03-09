import express from 'express'
import { getMovies } from '../controllers'
const router = express.Router()

router.get('/', getMovies)

export default router
