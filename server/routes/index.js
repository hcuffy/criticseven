import express from 'express'
import {getPopular} from '../actions'
import movieRoutes from './movieRoutes'

const router = express.Router()

router.use('/movies', movieRoutes())
router.get('/', getPopular)

export default router
