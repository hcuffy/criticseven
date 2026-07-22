import express from 'express'
import { createReview } from '../actions'

const reviewRoutes = () => {
	const router = express.Router()

	router.post('/', createReview)

	return router
}

export default reviewRoutes
