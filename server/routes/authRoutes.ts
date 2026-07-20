import express from 'express'
import { requestCode, verifyCode } from '../actions/auth'

const authRoutes = () => {
	const router = express.Router()

	router.post('/request-code', requestCode)
	router.post('/verify-code', verifyCode)

	return router
}

export default authRoutes
