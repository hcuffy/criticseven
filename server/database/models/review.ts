import mongoose, { Schema } from 'mongoose'

export interface ReviewDocument extends mongoose.Document {
	userId: mongoose.Types.ObjectId
	// TMDB's own numeric movie id, not a local Movie ObjectId — nothing in
	// this codebase creates local Movie documents from TMDB data yet, and
	// every other movie-scoped endpoint (server/actions/movies.ts) already
	// keys off the TMDB id, so reviews/opinions match that identifier space
	// instead of an unpopulated local collection.
	movieId: number
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

const reviewSchema = new Schema<ReviewDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	movieId: { type: Number, required: true },
	plot: { type: Number, required: true, min: 1, max: 10 },
	acting: { type: Number, required: true, min: 1, max: 10 },
	writing: { type: Number, required: true, min: 1, max: 10 },
	score: { type: Number, required: true, min: 1, max: 10 },
	directing: { type: Number, required: true, min: 1, max: 10 },
	editing: { type: Number, required: true, min: 1, max: 10 },
	cinematography: { type: Number, required: true, min: 1, max: 10 },
	comment: { type: String, default: '' },
	createdAt: { type: Date, default: Date.now }
})

reviewSchema.index({ movieId: 1, createdAt: -1 })

// Enforces one review per user per movie at the database level, same
// reasoning as Vote's unique index (server/database/models/vote.ts).
reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true })

export const Review = mongoose.models.Review || mongoose.model<ReviewDocument>('Review', reviewSchema)
