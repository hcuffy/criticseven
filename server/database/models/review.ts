import mongoose, { Schema } from 'mongoose'

export interface ReviewDocument extends mongoose.Document {
	userId: mongoose.Types.ObjectId
	movieId: mongoose.Types.ObjectId
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
	movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
	plot: { type: Number, required: true },
	acting: { type: Number, required: true },
	writing: { type: Number, required: true },
	score: { type: Number, required: true },
	directing: { type: Number, required: true },
	editing: { type: Number, required: true },
	cinematography: { type: Number, required: true },
	comment: { type: String, default: '' },
	createdAt: { type: Date, default: Date.now }
})

reviewSchema.index({ movieId: 1, createdAt: -1 })

export const Review = mongoose.models.Review || mongoose.model<ReviewDocument>('Review', reviewSchema)
