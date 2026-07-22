import { TrailerOpinionDocument } from '../database/models/trailer-opinion'
import { UserDocument } from '../database/models/User'
import { VoteSummary } from '../lib/vote-counts'
import { toUserPublicDTO, UserPublicDTO } from './users'

export interface TrailerOpinionPublicDTO {
	id: string
	movieId: number
	author: UserPublicDTO
	hypeLevel: number
	comment: string
	netVoteCount: number
	viewerVote: 1 | -1 | null
	createdAt: Date
}

// userId must already be populated with the User document (see
// server/actions/opinions.ts) — same author-DTO reasoning as
// server/serializers/review.ts.
export type PopulatedTrailerOpinionDocument = Omit<TrailerOpinionDocument, 'userId'> & { userId: UserDocument }

export function toTrailerOpinionPublicDTO(
	opinion: PopulatedTrailerOpinionDocument,
	voteSummary: VoteSummary,
	lowTrustBadgeThreshold?: number
): TrailerOpinionPublicDTO {
	return {
		id: opinion.id,
		movieId: opinion.movieId,
		author: toUserPublicDTO(opinion.userId, lowTrustBadgeThreshold),
		hypeLevel: opinion.hypeLevel,
		comment: opinion.comment,
		netVoteCount: voteSummary.netVoteCount,
		viewerVote: voteSummary.viewerVote,
		createdAt: opinion.createdAt
	}
}
