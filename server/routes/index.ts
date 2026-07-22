import express from 'express'
import {getPopular} from '../actions'
import authRoutes from './auth-routes'
import movieRoutes from './movie-routes'
import opinionRoutes from './opinion-routes'
import reviewRoutes from './review-routes'
import voteRoutes from './vote-routes'

const router = express.Router()

router.use('/movies', movieRoutes())
router.use('/auth', authRoutes())
router.use('/opinions', opinionRoutes())
router.use('/reviews', reviewRoutes())
router.use('/votes', voteRoutes())
router.get('/', getPopular)

export default router
