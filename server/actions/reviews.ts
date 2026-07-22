import { NextFunction, Request, Response } from 'express'
import { Review } from '../database/models/review'
import { getConfig } from '../lib/config'
import { isDuplicateKeyError } from '../lib/mongo-errors'
import { PopulatedReviewDocument, toReviewPublicDTO } from '../serializers'
import { getAuthenticatedUserId, SESSION_COOKIE_NAME } from '../session'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

const REVIEW_CRITERIA = ['plot', 'acting', 'writing', 'score', 'directing', 'editing', 'cinematography'] as const

type ReviewCriterion = (typeof REVIEW_CRITERIA)[number]

const UNAUTHORIZED = {
	error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
}

interface CreateReviewBody {
	movieId?: unknown
	comment?: string
	plot?: unknown
	acting?: unknown
	writing?: unknown
	score?: unknown
	directing?: unknown
	editing?: unknown
	cinematography?: unknown
}

// Same trust boundary as server/actions/opinions.ts: identity comes from
// the signed `__session` cookie (server/session.ts), never a request body
// field — Express is directly reachable over the network.
export const createReview = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const userId = getAuthenticatedUserId(request.cookies?.[SESSION_COOKIE_NAME])

		if (!userId) {
			response.status(401).json(UNAUTHORIZED)
			return
		}

		const body = request.body as CreateReviewBody
		const { movieId, comment } = body

		if (typeof movieId !== 'number' || !Number.isFinite(movieId)) {
			response.status(400).json({
				error: { code: 'MISSING_FIELDS', message: 'movieId is required' }
			})
			return
		}

		// Accumulated during validation rather than reading body.plot etc.
		// individually afterward — every key is assigned below before use.
		const scores = {} as Record<ReviewCriterion, number>

		for (const criterion of REVIEW_CRITERIA) {
			const value = body[criterion]

			if (typeof value !== 'number' || !Number.isInteger(value)) {
				response.status(400).json({
					error: { code: 'MISSING_FIELDS', message: `${criterion} is required` }
				})
				return
			}

			if (value < 1 || value > 10) {
				response.status(400).json({
					error: { code: 'INVALID_CRITERION_VALUE', message: `${criterion} must be between 1 and 10` }
				})
				return
			}

			scores[criterion] = value
		}

		const review = await Review.create({ userId, movieId, comment: comment ?? '', ...scores })

		await review.populate('userId')

		const config = await getConfig()

		response.status(201).json(
			toReviewPublicDTO(review as unknown as PopulatedReviewDocument, config.lowTrustBadgeThreshold)
		)
	} catch (error) {
		// Unique index on (userId, movieId) — one review per user per movie.
		if (isDuplicateKeyError(error)) {
			response.status(409).json({
				error: { code: 'ALREADY_EXISTS', message: 'You have already reviewed this movie.' }
			})
			return
		}

		next(error)
	}
}

export const getMovieReviews = async(request: Request, response: Response, next: NextFunction) => {
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

		const [reviews, totalResults, config] = await Promise.all([
			Review.find({ movieId })
				.sort({ createdAt: -1 })
				.skip((page - 1) * pageSize)
				.limit(pageSize)
				.populate('userId'),
			Review.countDocuments({ movieId }),
			getConfig()
		])

		response.json({
			page,
			totalPages: Math.max(1, Math.ceil(totalResults / pageSize)),
			totalResults,
			results: (reviews as unknown as PopulatedReviewDocument[]).map(
				review => toReviewPublicDTO(review, config.lowTrustBadgeThreshold)
			)
		})
	} catch (error) {
		next(error)
	}
}
