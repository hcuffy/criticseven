import mongoose, { Schema } from 'mongoose'

export interface TrailerOpinionDocument extends mongoose.Document {
	userId: mongoose.Types.ObjectId
	movieId: mongoose.Types.ObjectId
	hypeLevel: number
	comment: string
	createdAt: Date
}

const trailerOpinionSchema = new Schema<TrailerOpinionDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
	hypeLevel: { type: Number, required: true, min: 1, max: 5 },
	comment: { type: String, default: '' },
	createdAt: { type: Date, default: Date.now }
})

trailerOpinionSchema.index({ movieId: 1, createdAt: -1 })

export const TrailerOpinion =
	mongoose.models.TrailerOpinion || mongoose.model<TrailerOpinionDocument>('TrailerOpinion', trailerOpinionSchema)
