import { NextFunction, Request, Response } from 'express'
import { User } from '../database/models/User'
import { Review } from '../database/models/review'
import { TrailerOpinion } from '../database/models/trailer-opinion'
import { getConfig } from '../lib/config'
import { getVoteSummaries } from '../lib/vote-counts'
import { PopulatedReviewDocument, PopulatedTrailerOpinionDocument, toReviewPublicDTO, toTrailerOpinionPublicDTO } from '../serializers'
import { toUserPublicDTO } from '../serializers/users'
import { getAuthenticatedUserId, SESSION_COOKIE_NAME } from '../session'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

const NOT_FOUND = {
	error: { code: 'NOT_FOUND', message: 'User not found.' }
}

export const getUserProfile = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const user = await User.findOne({ username: request.params.username })

		if (!user) {
			response.status(404).json(NOT_FOUND)
			return
		}

		const config = await getConfig()

		response.json(toUserPublicDTO(user, config.lowTrustBadgeThreshold))
	} catch (error) {
		next(error)
	}
}

// Same public-listing shape as server/actions/reviews.ts's getMovieReviews,
// scoped by author instead of by movie. viewerVote personalization follows
// the same rule: no cookie means no viewer identity, not a 401.
export const getUserReviews = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const user = await User.findOne({ username: request.params.username })

		if (!user) {
			response.status(404).json(NOT_FOUND)
			return
		}

		const page = Math.max(1, Math.trunc(Number(request.query.page)) || 1)
		const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(Number(request.query.limit)) || DEFAULT_PAGE_SIZE))
		const viewerId = getAuthenticatedUserId(request.cookies?.[SESSION_COOKIE_NAME])

		const [reviews, totalResults, config] = await Promise.all([
			Review.find({ userId: user._id })
				.sort({ createdAt: -1 })
				.skip((page - 1) * pageSize)
				.limit(pageSize)
				.populate('userId'),
			Review.countDocuments({ userId: user._id }),
			getConfig()
		])
		const voteSummaries = await getVoteSummaries('review', reviews.map(review => review._id), viewerId)

		response.json({
			page,
			totalPages: Math.max(1, Math.ceil(totalResults / pageSize)),
			totalResults,
			results: (reviews as unknown as PopulatedReviewDocument[]).map(
				review => toReviewPublicDTO(
					review,
					voteSummaries.get(review.id) ?? { netVoteCount: 0, viewerVote: null },
					config.lowTrustBadgeThreshold
				)
			)
		})
	} catch (error) {
		next(error)
	}
}

export const getUserOpinions = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const user = await User.findOne({ username: request.params.username })

		if (!user) {
			response.status(404).json(NOT_FOUND)
			return
		}

		const page = Math.max(1, Math.trunc(Number(request.query.page)) || 1)
		const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(Number(request.query.limit)) || DEFAULT_PAGE_SIZE))
		const viewerId = getAuthenticatedUserId(request.cookies?.[SESSION_COOKIE_NAME])

		const [opinions, totalResults, config] = await Promise.all([
			TrailerOpinion.find({ userId: user._id })
				.sort({ createdAt: -1 })
				.skip((page - 1) * pageSize)
				.limit(pageSize)
				.populate('userId'),
			TrailerOpinion.countDocuments({ userId: user._id }),
			getConfig()
		])
		const voteSummaries = await getVoteSummaries('opinion', opinions.map(opinion => opinion._id), viewerId)

		response.json({
			page,
			totalPages: Math.max(1, Math.ceil(totalResults / pageSize)),
			totalResults,
			results: (opinions as unknown as PopulatedTrailerOpinionDocument[]).map(
				opinion => toTrailerOpinionPublicDTO(
					opinion,
					voteSummaries.get(opinion.id) ?? { netVoteCount: 0, viewerVote: null },
					config.lowTrustBadgeThreshold
				)
			)
		})
	} catch (error) {
		next(error)
	}
}
