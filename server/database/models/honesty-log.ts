import mongoose, { Schema } from 'mongoose'

export interface HonestyLogDocument extends mongoose.Document {
	userId: mongoose.Types.ObjectId
	delta: number
	reason: string
	createdAt: Date
}

const honestyLogSchema = new Schema<HonestyLogDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	delta: { type: Number, required: true },
	reason: { type: String, required: true },
	createdAt: { type: Date, default: Date.now }
})

// Recalculation job (server/lib/honesty-score.ts) reads a user's entries
// ordered by recency — index matches that access pattern.
honestyLogSchema.index({ userId: 1, createdAt: -1 })

export const HonestyLog =
	mongoose.models.HonestyLog || mongoose.model<HonestyLogDocument>('HonestyLog', honestyLogSchema)
