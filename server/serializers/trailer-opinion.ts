import { TrailerOpinionDocument } from '../database/models/trailer-opinion'

export interface TrailerOpinionPublicDTO {
	id: string
	userId: string
	movieId: string
	hypeLevel: number
	comment: string
	createdAt: Date
}

export function toTrailerOpinionPublicDTO(opinion: TrailerOpinionDocument): TrailerOpinionPublicDTO {
	return {
		id: opinion.id,
		userId: opinion.userId.toString(),
		movieId: opinion.movieId.toString(),
		hypeLevel: opinion.hypeLevel,
		comment: opinion.comment,
		createdAt: opinion.createdAt
	}
}
