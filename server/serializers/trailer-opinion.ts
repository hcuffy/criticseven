import { TrailerOpinionDocument } from '../database/models/trailer-opinion'
import { UserDocument } from '../database/models/User'
import { toUserPublicDTO, UserPublicDTO } from './users'

export interface TrailerOpinionPublicDTO {
	id: string
	movieId: number
	author: UserPublicDTO
	hypeLevel: number
	comment: string
	createdAt: Date
}

// userId must already be populated with the User document (see
// server/actions/opinions.ts) — same author-DTO reasoning as
// server/serializers/review.ts.
export type PopulatedTrailerOpinionDocument = Omit<TrailerOpinionDocument, 'userId'> & { userId: UserDocument }

export function toTrailerOpinionPublicDTO(
	opinion: PopulatedTrailerOpinionDocument,
	lowTrustBadgeThreshold?: number
): TrailerOpinionPublicDTO {
	return {
		id: opinion.id,
		movieId: opinion.movieId,
		author: toUserPublicDTO(opinion.userId, lowTrustBadgeThreshold),
		hypeLevel: opinion.hypeLevel,
		comment: opinion.comment,
		createdAt: opinion.createdAt
	}
}
