import express from 'express'
import {getPopular} from '../actions'
import authRoutes from './auth-routes'
import movieRoutes from './movie-routes'

const router = express.Router()

router.use('/movies', movieRoutes())
router.use('/auth', authRoutes())
router.get('/', getPopular)

export default router
