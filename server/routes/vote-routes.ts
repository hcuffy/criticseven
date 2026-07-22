import express from 'express'
import { castVote, removeVote } from '../actions'

const voteRoutes = () => {
	const router = express.Router()

	router.post('/', castVote)
	router.delete('/', removeVote)

	return router
}

export default voteRoutes
