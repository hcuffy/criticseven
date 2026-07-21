import { ReviewDocument } from '../database/models/review'

export interface ReviewPublicDTO {
	id: string
	userId: string
	movieId: string
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

export function toReviewPublicDTO(review: ReviewDocument): ReviewPublicDTO {
	return {
		id: review.id,
		userId: review.userId.toString(),
		movieId: review.movieId.toString(),
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
