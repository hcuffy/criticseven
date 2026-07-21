import mongoose, { Schema } from 'mongoose'

export interface MovieDocument extends mongoose.Document {
	title: string
	trailerUrl: string | null
	metadata: Record<string, unknown>
	createdAt: Date
}

const movieSchema = new Schema<MovieDocument>({
	title: { type: String, required: true },
	trailerUrl: { type: String, default: null },
	metadata: { type: Schema.Types.Mixed, default: {} },
	createdAt: { type: Date, default: Date.now }
})

export const Movie = mongoose.models.Movie || mongoose.model<MovieDocument>('Movie', movieSchema)
