import { NextFunction, Request, Response } from 'express'
import { TrailerOpinion } from '../database/models/trailer-opinion'
import { getConfig } from '../lib/config'
import { isDuplicateKeyError } from '../lib/mongo-errors'
import { PopulatedTrailerOpinionDocument, toTrailerOpinionPublicDTO } from '../serializers'
import { getAuthenticatedUserId, SESSION_COOKIE_NAME } from '../session'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

const UNAUTHORIZED = {
	error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
}

// Express is directly reachable over the network, so a body-supplied userId
// would let anyone curl this endpoint and post as anyone — identity is
// derived from the signed `__session` cookie instead (see
// server/session.ts), the same cookie the React Router layer already sets.
export const createOpinion = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const userId = getAuthenticatedUserId(request.cookies?.[SESSION_COOKIE_NAME])

		if (!userId) {
			response.status(401).json(UNAUTHORIZED)
			return
		}

		const { movieId, hypeLevel, comment } = request.body as {
			movieId?: unknown
			hypeLevel?: unknown
			comment?: string
		}

		if (typeof movieId !== 'number' || !Number.isFinite(movieId) || typeof hypeLevel !== 'number' ||
			!Number.isInteger(hypeLevel)) {
			response.status(400).json({
				error: { code: 'MISSING_FIELDS', message: 'movieId and hypeLevel are required' }
			})
			return
		}

		if (hypeLevel < 1 || hypeLevel > 5) {
			response.status(400).json({
				error: { code: 'INVALID_HYPE_LEVEL', message: 'hypeLevel must be between 1 and 5' }
			})
			return
		}

		const opinion = await TrailerOpinion.create({ userId, movieId, hypeLevel, comment: comment ?? '' })

		await opinion.populate('userId')

		const config = await getConfig()

		response.status(201).json(
			toTrailerOpinionPublicDTO(opinion as unknown as PopulatedTrailerOpinionDocument, config.lowTrustBadgeThreshold)
		)
	} catch (error) {
		// Unique index on (userId, movieId) — one opinion per user per movie.
		if (isDuplicateKeyError(error)) {
			response.status(409).json({
				error: { code: 'ALREADY_EXISTS', message: 'You have already shared an opinion on this movie.' }
			})
			return
		}

		next(error)
	}
}

export const getMovieOpinions = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const movieId = Number(request.params.movieId)

		if (!Number.isInteger(movieId)) {
			response.status(400).json({
				error: { code: 'INVALID_MOVIE_ID', message: 'movieId must be an integer' }
			})
			return
		}

		const page = Math.max(1, Math.trunc(Number(request.query.page)) || 1)
		const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(Number(request.query.limit)) || DEFAULT_PAGE_SIZE))

		const [opinions, totalResults, config] = await Promise.all([
			TrailerOpinion.find({ movieId })
				.sort({ createdAt: -1 })
				.skip((page - 1) * pageSize)
				.limit(pageSize)
				.populate('userId'),
			TrailerOpinion.countDocuments({ movieId }),
			getConfig()
		])

		response.json({
			page,
			totalPages: Math.max(1, Math.ceil(totalResults / pageSize)),
			totalResults,
			results: (opinions as unknown as PopulatedTrailerOpinionDocument[]).map(
				opinion => toTrailerOpinionPublicDTO(opinion, config.lowTrustBadgeThreshold)
			)
		})
	} catch (error) {
		next(error)
	}
}
