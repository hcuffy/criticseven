import express from 'express'
import { requestCode } from '../actions/auth'

const authRoutes = () => {
	const router = express.Router()

	router.post('/request-code', requestCode)

	return router
}

export default authRoutes
