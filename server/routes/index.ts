import express from 'express'
import {getPopular} from '../actions'
import authRoutes from './authRoutes'
import movieRoutes from './movieRoutes'

const router = express.Router()

router.use('/movies', movieRoutes())
router.use('/auth', authRoutes())
router.get('/', getPopular)

export default router
