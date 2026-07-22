import express from 'express'
import { createOpinion } from '../actions'

const opinionRoutes = () => {
	const router = express.Router()

	router.post('/', createOpinion)

	return router
}

export default opinionRoutes
