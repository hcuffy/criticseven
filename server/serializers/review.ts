import { ReviewDocument } from '../database/models/review'
import { UserDocument } from '../database/models/User'
import { toUserPublicDTO, UserPublicDTO } from './users'

export interface ReviewPublicDTO {
	id: string
	movieId: number
	author: UserPublicDTO
	plot: number
	acting: number
	writing: number
	score: number
	directing: number
	editing: number
	cinematography: number
	comment: string
	createdAt: Date
}

// userId must already be populated with the User document (see
// server/actions/reviews.ts) — the author is exposed as UserPublicDTO
// (username, honestyScore, isLowTrust, isPhoneVerified), never the raw
// userId or email, per the data-minimization gate.
export type PopulatedReviewDocument = Omit<ReviewDocument, 'userId'> & { userId: UserDocument }

export function toReviewPublicDTO(
	review: PopulatedReviewDocument,
	lowTrustBadgeThreshold?: number
): ReviewPublicDTO {
	return {
		id: review.id,
		movieId: review.movieId,
		author: toUserPublicDTO(review.userId, lowTrustBadgeThreshold),
		plot: review.plot,
		acting: review.acting,
		writing: review.writing,
		score: review.score,
		directing: review.directing,
		editing: review.editing,
		cinematography: review.cinematography,
		comment: review.comment,
		createdAt: review.createdAt
	}
}
