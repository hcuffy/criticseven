import express from 'express'
import {
	getCredits, getDetails, getImages, getLatest, getNowPlaying, getPopular, getUpcoming, getVideos
} from '../actions'

const movieRoutes = () => {
	const router = express.Router()

	router.get('/credits', getCredits)
	router.get('/images', getImages)
	router.get('/videos', getVideos)
	router.get('/details', getDetails)
	router.get('/upcoming', getUpcoming)
	router.get('/playing', getNowPlaying)
	router.get('/latest', getLatest)
	router.get('/popular', getPopular)

	return router
}

export default movieRoutes