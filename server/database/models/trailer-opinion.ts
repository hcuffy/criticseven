import mongoose, { Schema } from 'mongoose'

export interface TrailerOpinionDocument extends mongoose.Document {
	userId: mongoose.Types.ObjectId
	// TMDB's own numeric movie id — see the matching comment on
	// server/database/models/review.ts for why this isn't a local Movie ref.
	movieId: number
	hypeLevel: number
	comment: string
	createdAt: Date
}

const trailerOpinionSchema = new Schema<TrailerOpinionDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	movieId: { type: Number, required: true },
	hypeLevel: { type: Number, required: true, min: 1, max: 5 },
	comment: { type: String, default: '' },
	createdAt: { type: Date, default: Date.now }
})

trailerOpinionSchema.index({ movieId: 1, createdAt: -1 })

// Enforces one opinion per user per movie at the database level, same
// reasoning as Vote's unique index (server/database/models/vote.ts).
trailerOpinionSchema.index({ userId: 1, movieId: 1 }, { unique: true })

export const TrailerOpinion =
	mongoose.models.TrailerOpinion || mongoose.model<TrailerOpinionDocument>('TrailerOpinion', trailerOpinionSchema)
