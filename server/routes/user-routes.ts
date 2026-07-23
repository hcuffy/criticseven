import express from 'express'
import { getUserOpinions, getUserProfile, getUserReviews } from '../actions'

const userRoutes = () => {
	const router = express.Router()

	router.get('/:username', getUserProfile)
	router.get('/:username/reviews', getUserReviews)
	router.get('/:username/opinions', getUserOpinions)

	return router
}

export default userRoutes
